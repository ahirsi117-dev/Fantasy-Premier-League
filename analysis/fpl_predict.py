"""
FPL Gameweek Predictor
----------------------
Reads an FPL per-gameweek stats CSV and:
  1. Ranks players by position (expected points, actual points, minutes, xGI/90)
  2. Predicts your XI's score for the next gameweek with a Monte Carlo simulation

Usage:
    python fpl_predict.py fpl-data-stats.csv

Edit the SETTINGS section below each gameweek (squad, fixture difficulty,
captain, availability). Needs: pandas, numpy  ->  pip install pandas numpy

Required CSV columns:
    web_name, team_name, element_type, gameweek, now_cost, minutes,
    total_points, expected_points, expected_goal_involvements
"""

import sys
import numpy as np
import pandas as pd

# =====================================================================
# SETTINGS - edit these each gameweek
# =====================================================================

# Your starting XI: (FPL web_name, team_name as in the CSV, fixture difficulty 1-5)
XI = [
    ("Raya",      "Arsenal",       2),
    ("Calafiori", "Arsenal",       2),
    ("Tarkowski", "Everton",       2),
    ("Murillo",   "Nott'm Forest", 3),
    ("Hall",      "Newcastle",     2),
    ("Saka",      "Arsenal",       2),
    ("Groß",      "Brighton",      3),
    ("E.Le Fée",  "Sunderland",    2),
    ("Mbeumo",    "Man Utd",       3),
    ("Haaland",   "Man City",      4),
    ("Barry",     "Everton",       2),
]

CAPTAIN = "Saka"

# Chance each player plays (1.0 = certain). Anyone missing gets SUB_POINTS instead.
PLAY_PROB = {
    "Haaland": 0.70,   # fatigue / fitness doubt after international break
    "Hall":    0.85,   # played 4 games in the break
    "Saka":    0.90,   # rested v Czechia, small knock risk
}
SUB_POINTS = 2.0   # rough points from an auto-sub

# Minutes-risk: chance of playing 60+ minutes is estimated from the CSV as
# (games with 60+ mins + 1) / (games + 1), capped at BASE_PLAY_PROB. PLAY_PROB overrides it.
AUTO_MINUTES_RISK = True
BASE_PLAY_PROB = 0.93   # assumed baseline rotation/injury risk for any starter (judgement, not data)

# Fixture multiplier by difficulty (my own assumption - adjust freely)
FDR_MULT = {1: 1.20, 2: 1.10, 3: 1.00, 4: 0.85, 5: 0.75}

# Blend of expected points vs actual points (0.6 = 60% expected, 40% actual)
XP_WEIGHT = 0.6

SIMULATIONS = 50_000
SEED = 7
TARGETS = [50, 60, 70, 80, 90]
MIN_MINUTES_FOR_RANKING = 300

# =====================================================================


def load(path):
    df = pd.read_csv(path)
    needed = {"web_name", "team_name", "element_type", "gameweek", "now_cost",
              "minutes", "total_points", "expected_points",
              "expected_goal_involvements"}
    missing = needed - set(df.columns)
    if missing:
        sys.exit(f"CSV is missing columns: {sorted(missing)}")
    return df


def rank_players(df):
    """Season-to-date summary per player, current club only."""
    latest_gw = df["gameweek"].max()
    current = df[df["gameweek"] == latest_gw][["web_name", "team_name"]]
    g = (df.groupby(["web_name", "team_name"], as_index=False)
           .agg(pos=("element_type", "last"),
                cost=("now_cost", "last"),
                pts=("total_points", "sum"),
                xp=("expected_points", "sum"),
                mins=("minutes", "sum"),
                xgi=("expected_goal_involvements", "sum")))
    g = g.merge(current, on=["web_name", "team_name"])
    g["xgi90"] = g["xgi"] / g["mins"].clip(lower=1) * 90
    g = g[g["mins"] >= MIN_MINUTES_FOR_RANKING]

    names = {1: "GOALKEEPERS", 2: "DEFENDERS", 3: "MIDFIELDERS", 4: "FORWARDS"}
    for pos, label in names.items():
        top = g[g["pos"] == pos].sort_values("xp", ascending=False).head(10)
        print(f"\n=== {label} (top 10 by expected points) ===")
        print(top[["web_name", "team_name", "cost", "pts", "xp", "mins", "xgi90"]]
              .round(2).to_string(index=False))


def predict(df):
    rows, base, actual_mean, labels = [], [], [], []
    for name, team, fdr in XI:
        s = df[(df["web_name"] == name) & (df["team_name"] == team)].sort_values("gameweek")
        if s.empty:
            sys.exit(f"Player not found in CSV: {name} ({team}). Check spelling.")
        mult = FDR_MULT[fdr]
        pts = s["total_points"].to_numpy(dtype=float) * mult
        xp_mean = s["expected_points"].mean() * mult
        act_mean = pts.mean()
        rows.append(pts)
        actual_mean.append(act_mean)
        base.append(XP_WEIGHT * xp_mean + (1 - XP_WEIGHT) * act_mean)
        labels.append((name, team, fdr))

    base = np.array(base)
    play_prob = {}
    for n, t, _ in XI:
        s = df[(df["web_name"] == n) & (df["team_name"] == t)]
        k, g = int((s["minutes"] >= 60).sum()), len(s)
        auto = min(BASE_PLAY_PROB, (k + 1) / (g + 1)) if AUTO_MINUTES_RISK else 1.0
        play_prob[n] = PLAY_PROB.get(n, auto)
    actual_mean = np.array(actual_mean)
    # Scale each player's real week-to-week scores so their average equals the blended base
    scale = base / np.maximum(actual_mean, 0.1)

    names = [n for n, _, _ in XI]
    if CAPTAIN not in names:
        sys.exit(f"Captain {CAPTAIN} is not in the XI.")
    cap = names.index(CAPTAIN)

    rng = np.random.default_rng(SEED)
    totals = np.empty(SIMULATIONS)
    for k in range(SIMULATIONS):
        week = np.array([rng.choice(r) * scale[i] for i, r in enumerate(rows)])
        for i, n in enumerate(names):
            if rng.random() > play_prob[n]:
                week[i] = SUB_POINTS
        totals[k] = week.sum() + week[cap]   # captain counts double

    print("\n=== EXPECTED POINTS PER PLAYER ===")
    for i, (n, t, f) in enumerate(labels):
        p = play_prob[n]
        exp_i = p * base[i] + (1 - p) * SUB_POINTS
        tag = " (C, x2)" if i == cap else ""
        print(f"{n:<12} {t:<15} FDR {f}  ~{exp_i * (2 if i == cap else 1):5.1f}  P(play)={p:.2f}{tag}")

    print("\n=== PREDICTED TEAM SCORE ===")
    for q in (10, 25, 50, 75, 90):
        print(f"{q:>3}th percentile: {np.percentile(totals, q):5.1f}")
    print()
    for t in TARGETS:
        print(f"Chance of {t}+ points: {(totals >= t).mean() * 100:5.1f}%")


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "fpl-data-stats.csv"
    data = load(path)
    rank_players(data)
    predict(data)
