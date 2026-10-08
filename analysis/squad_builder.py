"""2026-27 FPL squad builder.

Usage:
  python analysis/squad_builder.py add NEW.csv        # upsert new per-player GW rows (key: id+gameweek)
  python analysis/squad_builder.py build [--budget 100.0] [--gw 6] [--horizon 5]

Master file: data/2026-27/player_stats_gw.csv (same columns as the uploaded stats CSV).
"""
import argparse, os, random, sys
import pandas as pd

MASTER = 'data/2026-27/player_stats_gw.csv'
TEAMS = 'data/2026-27/teams.csv'
FIXTURES = 'data/2026-27/fixtures.csv'
NAMEFIX = {'Coventry City': 'Coventry', 'Hull City': 'Hull', 'Ipswich Town': 'Ipswich'}
NEED = {1: 2, 2: 5, 3: 5, 4: 3}
FORMS = [(3, 4, 3), (3, 5, 2), (4, 3, 3), (4, 4, 2), (4, 5, 1), (5, 3, 2), (5, 4, 1)]


def add(path):
    new = pd.read_csv(path)
    if os.path.exists(MASTER):
        old = pd.read_csv(MASTER)
        df = pd.concat([old, new]).drop_duplicates(['id', 'gameweek'], keep='last')
    else:
        df = new
    df.sort_values(['gameweek', 'id']).to_csv(MASTER, index=False)
    print(f'master now {len(df)} rows, GWs {sorted(df.gameweek.unique())}')


def project(gw, horizon):
    d = pd.read_csv(MASTER)
    last = d.sort_values('gameweek').groupby('id').last()
    n_gw = d.gameweek.nunique()
    agg = d.groupby('id').agg(mins=('minutes', 'sum'), xp=('expected_points', 'sum'), pts=('total_points', 'sum'))
    recent = d[d.gameweek > d.gameweek.max() - 3].groupby('id').minutes.sum() / (90 * 3)
    P = last[['web_name', 'team_name', 'element_type', 'now_cost']].join(agg).join(recent.rename('recmin')).fillna(0)
    m = P.mins.clip(lower=1)
    P['rate'] = 0.75 * P.xp / m * 90 + 0.25 * P.pts / m * 90          # points per 90, xP-led
    prior = P[P.mins >= 180].groupby('element_type').rate.mean()
    w = P.mins / (P.mins + 180)                                          # shrink small samples
    P['rate'] = w * P.rate + (1 - w) * P.element_type.map(prior) * 0.6
    P['avail'] = (0.5 * P.mins / (90 * n_gw) + 0.5 * P.recmin).clip(0, 1)
    P.loc[P.mins < 90, 'avail'] *= 0.5
    P['base'] = P.rate * P.avail

    teams = pd.read_csv(TEAMS)
    tid = {NAMEFIX.get(n, n): i for i, n in zip(teams.id, teams.name)}
    f = pd.read_csv(FIXTURES)
    f = f[f.event.between(gw, gw + horizon - 1)]
    fx = {}
    for _, r in f.iterrows():
        fx.setdefault(r.team_h, []).append((r.event, r.team_h_difficulty))
        fx.setdefault(r.team_a, []).append((r.event, r.team_a_difficulty))
    wt = lambda ev: max(0.5, 1 - 0.1 * (ev - gw))
    mult = lambda df: 1 + 0.10 * (3 - df)
    def fxscore(t, only=None):
        return sum(wt(e) * mult(x) for e, x in fx.get(tid[t], []) if only in (None, e))
    P['gw'] = [b * fxscore(t, gw) for b, t in zip(P.base, P.team_name)]
    P['hor'] = [b * fxscore(t) for b, t in zip(P.base, P.team_name)]
    P['fix'] = [' '.join(str(x) for _, x in sorted(fx.get(tid[t], []))) for t in P.team_name]
    return P[P.avail > 0.3]


def optimise(P, budget, restarts=60, pool=25):
    val, cost, pos, team = P.hor.to_dict(), P.now_cost.to_dict(), P.element_type.to_dict(), P.team_name.to_dict()
    cand = {p: list(P[P.element_type == p].sort_values('hor', ascending=False).index[:pool]) for p in NEED}
    cheap = {p: list(P[P.element_type == p].sort_values('now_cost').index) for p in NEED}

    def score(sq):
        by = {p: sorted((val[i] for i in sq if pos[i] == p), reverse=True) for p in NEED}
        best = max(by[1][0] + sum(by[2][:a]) + sum(by[3][:b]) + sum(by[4][:c]) for a, b, c in FORMS)
        return best + 0.08 * (sum(val[i] for i in sq) - best)

    def ok(sq):
        if sum(cost[i] for i in sq) > budget + 1e-9: return False
        cnt = {}
        for i in sq: cnt[team[i]] = cnt.get(team[i], 0) + 1
        return max(cnt.values()) <= 3

    random.seed(1)
    best, bs = None, -1
    for _ in range(restarts):
        sq = []
        for p, n in NEED.items():
            sq += sorted(cand[p], key=lambda i: -val[i] * random.uniform(.6, 1))[:n]
        for _ in range(100):                      # repair to budget / team limit
            if ok(sq): break
            j = max(sq, key=lambda i: cost[i])
            alt = [i for i in cand[pos[j]] + cheap[pos[j]][:10] if i not in sq and cost[i] < cost[j]]
            if not alt: break
            sq[sq.index(j)] = max(alt, key=lambda i: val[i])
        if not ok(sq): continue
        cur, improved = score(sq), True
        while improved:                            # single-swap hill climb
            improved = False
            for a in list(sq):
                for b in cand[pos[a]]:
                    if b in sq: continue
                    t = [b if x == a else x for x in sq]
                    if ok(t) and score(t) > cur + 1e-9:
                        sq, cur, improved = t, score(t), True
                        break
                if improved: break
        if cur > bs: bs, best = cur, sq
    return best


def pick_xi(P, sq):
    best = None
    for a, b, c in FORMS:
        out = {p: list(P.loc[[i for i in sq if P.element_type[i] == p]].sort_values('gw', ascending=False).index) for p in NEED}
        xi = out[1][:1] + out[2][:a] + out[3][:b] + out[4][:c]
        s = P.gw[xi].sum()
        if best is None or s > best[0]: best = (s, (a, b, c), xi, out)
    return best


def build(budget, gw, horizon):
    P = project(gw, horizon)
    sq = optimise(P, budget)
    s, form, xi, out = pick_xi(P, sq)
    bench_out = sorted([i for i in sq if i not in xi and P.element_type[i] != 1], key=lambda i: -P.gw[i])
    bench = [i for i in out[1] if i not in xi] + bench_out
    cap = sorted(xi, key=lambda i: -P.gw[i])[:2]
    cols = ['web_name', 'team_name', 'now_cost', 'avail', 'gw', 'hor', 'fix']
    print(f'GW{gw} squad  cost £{P.now_cost[sq].sum():.1f}m / £{budget}m  formation {form[0]}-{form[1]}-{form[2]}')
    print(f'XI proj GW{gw}: {s:.1f}  captain {P.web_name[cap[0]]}  vice {P.web_name[cap[1]]}\n')
    print('XI'); print(P.loc[xi, cols].round(2).to_string())
    print('\nBench (order)'); print(P.loc[bench, cols].round(2).to_string())


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['add', 'build'])
    ap.add_argument('file', nargs='?')
    ap.add_argument('--budget', type=float, default=100.0)
    ap.add_argument('--gw', type=int, default=6)
    ap.add_argument('--horizon', type=int, default=5)
    a = ap.parse_args()
    add(a.file) if a.cmd == 'add' else build(a.budget, a.gw, a.horizon)
