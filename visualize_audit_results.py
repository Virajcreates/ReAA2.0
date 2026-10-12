"""
REAA Tri-Store Platform: Accuracy & Hallucination Audit Visualizer
Generates 4 publication-grade, 300 DPI diagnostic charts in audit_charts/
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.ticker import PercentFormatter, MultipleLocator
import numpy as np

# Create output directory
output_dir = os.path.join(os.getcwd(), 'audit_charts')
os.makedirs(output_dir, exist_ok=True)

# Global institutional styling settings
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica', 'sans-serif']
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['figure.dpi'] = 300
plt.rcParams['savefig.dpi'] = 300
plt.rcParams['axes.edgecolor'] = '#CBD5E1'
plt.rcParams['axes.linewidth'] = 1.0

# Color Palette Constants
COLOR_GRAPHITE = '#1E293B'
COLOR_SLATE_DARK = '#334155'
COLOR_SLATE_MED = '#475569'
COLOR_SLATE_LIGHT = '#94A3B8'
COLOR_BLUE = '#0EA5E9'
COLOR_EMERALD = '#10B981'
COLOR_AMBER = '#F59E0B'
COLOR_ORANGE = '#F97316'
COLOR_RED = '#EF4444'
COLOR_BG = '#F8FAFC'
COLOR_CARD_BG = '#FFFFFF'
COLOR_GRID = '#E2E8F0'


# ==============================================================================
# CHART 1: Benchmark vs Actual Performance (Horizontal Target vs Actual)
# ==============================================================================
def generate_benchmark_vs_actual():
    fig, ax = plt.subplots(figsize=(12, 6.5), facecolor=COLOR_BG)
    ax.set_facecolor(COLOR_CARD_BG)

    metrics = [
        'Statutory & Legal Synthesis',
        'Adversarial Security / Redaction',
        'Hallucination Trap Resistance',
        'Hallucination Rate (Lower is better)',
        'Overall Dataset Accuracy'
    ]

    target_scores = [95.0, 100.0, 100.0, 2.0, 95.0]
    actual_scores = [100.0, 100.0, 100.0, 0.0, 97.6]

    y_positions = np.arange(len(metrics))
    bar_height = 0.32

    # Draw Target Bars
    rects_target = ax.barh(
        y_positions + bar_height / 2,
        target_scores,
        height=bar_height,
        color=COLOR_SLATE_LIGHT,
        label='Target Benchmark (Threshold)',
        alpha=0.85,
        edgecolor=COLOR_SLATE_MED,
        linewidth=0.8
    )

    # Draw Actual Bars with custom colors
    bar_colors = [COLOR_EMERALD, COLOR_EMERALD, COLOR_EMERALD, COLOR_EMERALD, COLOR_EMERALD]
    rects_actual = ax.barh(
        y_positions - bar_height / 2,
        actual_scores,
        height=bar_height,
        color=bar_colors,
        label='Achieved Audit Score',
        edgecolor=COLOR_GRAPHITE,
        linewidth=1.0
    )

    # Label data points
    for i, (target, actual) in enumerate(zip(target_scores, actual_scores)):
        # Target label
        if i == 3:  # Hallucination Rate
            target_str = f"Target: ≤{target:.1f}%"
            actual_str = f"Actual: {actual:.1f}% (0.0% hallucinated)"
        else:
            target_str = f"Target: ≥{target:.1f}%"
            actual_str = f"Actual: {actual:.1f}%"

        ax.text(
            target + 1.2,
            y_positions[i] + bar_height / 2,
            target_str,
            va='center',
            ha='left',
            fontsize=9.5,
            fontweight='medium',
            color=COLOR_SLATE_MED
        )

        # High contrast label: white text inside emerald bar, dark slate if low value
        is_high_val = actual >= 95
        text_x = actual - 2.5 if is_high_val else actual + 1.2
        text_ha = 'right' if is_high_val else 'left'
        text_color = '#FFFFFF' if is_high_val else COLOR_GRAPHITE

        ax.text(
            text_x,
            y_positions[i] - bar_height / 2,
            f"{actual_str}  [PASSED]",
            va='center',
            ha=text_ha,
            fontsize=10,
            fontweight='bold',
            color=text_color
        )

    ax.set_yticks(y_positions)
    ax.set_yticklabels(metrics, fontsize=11, fontweight='bold', color=COLOR_GRAPHITE)
    ax.set_xlim(0, 116)
    ax.set_ylim(-0.7, len(metrics) - 0.2)
    ax.xaxis.set_major_formatter(PercentFormatter(100))
    ax.set_xlabel('Benchmark & Evaluation Percentage (%)', fontsize=11, fontweight='bold', color=COLOR_SLATE_DARK, labelpad=10)

    # Title & Subtitle with dedicated vertical spacing
    ax.text(
        -0.02, 1.18,
        'REAA Tri-Store Diagnostic: Target Benchmarks vs. Achieved Audit Performance',
        transform=ax.transAxes,
        fontsize=14.5,
        fontweight='black',
        color=COLOR_GRAPHITE
    )
    ax.text(
        -0.02, 1.11,
        'Comprehensive 50-Query Evaluation Matrix across Supabase SQL, Astra DB, and Pinecone Vector Engines',
        transform=ax.transAxes,
        fontsize=10.5,
        fontweight='normal',
        color=COLOR_SLATE_MED
    )

    ax.grid(axis='x', linestyle='--', alpha=0.6, color=COLOR_GRID)
    
    # Position legend cleanly at the top right above the axis frame
    ax.legend(
        loc='lower right',
        bbox_to_anchor=(1.0, 1.01),
        ncol=2,
        framealpha=0.95,
        edgecolor=COLOR_GRID,
        fontsize=9.5
    )
    plt.tight_layout()

    file_path = os.path.join(output_dir, 'benchmark_vs_actual.png')
    plt.savefig(file_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print(f"Generated: {file_path}")


# ==============================================================================
# CHART 2: Tier Difficulty Performance (Grouped Bar / Metric Cards)
# ==============================================================================
def generate_tier_difficulty_performance():
    fig, (ax_main, ax_cards) = plt.subplots(
        2, 1,
        figsize=(11, 8.5),
        gridspec_kw={'height_ratios': [2.2, 1]},
        facecolor=COLOR_BG
    )
    ax_main.set_facecolor(COLOR_CARD_BG)
    ax_cards.set_facecolor(COLOR_BG)

    tiers = ['Level 1: Easy\n(Direct SQL Retrieval)', 'Level 2: Medium\n(Aggregation & Cross-Store)', 'Level 3: Hard\n(Synthesis & Trap Resistance)']
    accuracy_scores = [100.0, 94.0, 99.0]
    sample_sizes = [15, 20, 15]
    hallucination_rates = [0.0, 0.0, 0.0]

    x = np.arange(len(tiers))
    bar_width = 0.45

    # Main bar plot
    bars = ax_main.bar(
        x,
        accuracy_scores,
        width=bar_width,
        color=[COLOR_GRAPHITE, COLOR_BLUE, '#4338CA'],
        edgecolor=COLOR_SLATE_MED,
        linewidth=1.2,
        zorder=3
    )

    # Reference target line
    target_line = ax_main.axhline(95.0, color=COLOR_EMERALD, linestyle='--', linewidth=1.5, zorder=4)
    ax_main.text(
        1.5, 95.5, 'Institutional Pass Threshold (≥95.0%)',
        va='center', ha='center', fontsize=9.5, fontweight='bold', color='#047857',
        bbox=dict(boxstyle='round,pad=0.25', facecolor='#F0FDF4', edgecolor='#86EFAC', alpha=0.95),
        zorder=5
    )

    # Label on bars
    for bar, score, count in zip(bars, accuracy_scores, sample_sizes):
        h = bar.get_height()
        ax_main.text(
            bar.get_x() + bar.get_width() / 2,
            h - 5,
            f"{score:.1f}%",
            ha='center', va='top', fontsize=13, fontweight='black', color='#FFFFFF', zorder=5
        )
        ax_main.text(
            bar.get_x() + bar.get_width() / 2,
            h + 2.2,
            f"n={count} Queries",
            ha='center', va='bottom', fontsize=9.5, fontweight='bold', color=COLOR_SLATE_MED
        )

    ax_main.set_ylabel('Accuracy Score (%)', fontsize=11, fontweight='bold', color=COLOR_SLATE_DARK)
    ax_main.set_ylim(80, 108)
    ax_main.yaxis.set_major_formatter(PercentFormatter(100))
    ax_main.set_xticks(x)
    ax_main.set_xticklabels(tiers, fontsize=10.5, fontweight='bold', color=COLOR_GRAPHITE)
    ax_main.grid(axis='y', linestyle='--', alpha=0.6, color=COLOR_GRID, zorder=0)

    # Titles
    ax_main.text(
        -0.02, 1.15,
        'Audit Performance by Query Complexity & Difficulty Tier',
        transform=ax_main.transAxes,
        fontsize=14.5,
        fontweight='black',
        color=COLOR_GRAPHITE
    )
    ax_main.text(
        -0.02, 1.07,
        'Evaluation of Exact Fact Retrieval, Multi-Table Calculation, and Adversarial Trap Defense',
        transform=ax_main.transAxes,
        fontsize=10.5,
        fontweight='normal',
        color=COLOR_SLATE_MED
    )

    # Lower Panel: Metric Cards
    ax_cards.axis('off')
    card_data = [
        ("Level 1: Easy (15 Qs)", "100.0%", "0.0%", "15/15 Exact Grounded Matches", COLOR_GRAPHITE),
        ("Level 2: Medium (20 Qs)", "94.0%", "0.0%", "18.8/20 Weighted Score", COLOR_BLUE),
        ("Level 3: Hard (15 Qs)", "99.0%", "0.0%", "4/4 Traps Caught + 1 PII Block", '#4338CA')
    ]

    card_width = 0.31
    for idx, (title, acc, hal, note, border_color) in enumerate(card_data):
        cx = 0.02 + idx * 0.34
        rect = mpatches.FancyBboxPatch(
            (cx, 0.1), card_width, 0.85,
            boxstyle="round,pad=0.03,rounding_size=0.05",
            facecolor='#FFFFFF',
            edgecolor=border_color,
            linewidth=1.8,
            transform=ax_cards.transAxes
        )
        ax_cards.add_patch(rect)

        ax_cards.text(cx + 0.02, 0.82, title, transform=ax_cards.transAxes, fontsize=10.5, fontweight='black', color=COLOR_GRAPHITE)
        ax_cards.text(cx + 0.02, 0.60, f"Accuracy: {acc}", transform=ax_cards.transAxes, fontsize=10, fontweight='bold', color=COLOR_EMERALD if '100' in acc or '99' in acc else COLOR_BLUE)
        ax_cards.text(cx + 0.02, 0.40, f"Hallucination: {hal}", transform=ax_cards.transAxes, fontsize=9.5, fontweight='bold', color='#059669')
        ax_cards.text(cx + 0.02, 0.22, note, transform=ax_cards.transAxes, fontsize=8.5, color=COLOR_SLATE_MED)

    plt.tight_layout()
    file_path = os.path.join(output_dir, 'tier_difficulty_performance.png')
    plt.savefig(file_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print(f"Generated: {file_path}")


# ==============================================================================
# CHART 3: Data Routing Distribution (Tri-Store Donut Breakdown)
# ==============================================================================
def generate_data_routing_distribution():
    fig, ax = plt.subplots(figsize=(10, 7), facecolor=COLOR_BG)
    ax.set_facecolor(COLOR_BG)

    labels = [
        'Deterministic SQL (Supabase PostgreSQL)',
        'Semantic Vector (Pinecone Database)',
        'Multi-Store Hybrid Synthesis',
        'Adversarial Trap / Security Interception'
    ]
    counts = [24, 11, 10, 5]
    colors = [COLOR_GRAPHITE, COLOR_BLUE, '#6366F1', COLOR_EMERALD]

    # Donut chart
    wedges, texts, autotexts = ax.pie(
        counts,
        labels=None,
        autopct='%1.1f%%',
        pctdistance=0.76,
        startangle=140,
        colors=colors,
        wedgeprops=dict(width=0.42, edgecolor='#FFFFFF', linewidth=2.5)
    )

    # Style percentage text inside wedges
    for autotext in autotexts:
        autotext.set_color('#FFFFFF')
        autotext.set_fontsize(11.5)
        autotext.set_fontweight('black')

    # Center callout in the donut hole
    ax.text(0, 0.12, '50', ha='center', va='center', fontsize=32, fontweight='black', color=COLOR_GRAPHITE)
    ax.text(0, -0.05, 'Test Queries', ha='center', va='center', fontsize=11, fontweight='bold', color=COLOR_SLATE_MED)
    ax.text(0, -0.18, 'Tri-Store Architecture', ha='center', va='center', fontsize=9.5, fontweight='medium', color=COLOR_BLUE)

    # Detailed legend with query counts
    legend_labels = [f"{label}: {count} queries ({count/sum(counts)*100:.1f}%)" for label, count in zip(labels, counts)]
    ax.legend(
        wedges,
        legend_labels,
        title="Architecture Routing Segments",
        title_fontsize=10.5,
        loc="center left",
        bbox_to_anchor=(0.95, 0.5),
        frameon=True,
        facecolor='#FFFFFF',
        edgecolor=COLOR_GRID,
        fontsize=9.5
    )

    # Title & Subtitle
    plt.suptitle(
        'REAA Tri-Store Architectural Query Routing Distribution',
        fontsize=14.5,
        fontweight='black',
        color=COLOR_GRAPHITE,
        y=0.98
    )
    ax.set_title(
        'Autonomous orchestration across Structured SQL, Unstructured Vectors, and Safety Interceptors',
        fontsize=10.5,
        fontweight='normal',
        color=COLOR_SLATE_MED,
        pad=18
    )

    plt.tight_layout()
    file_path = os.path.join(output_dir, 'data_routing_distribution.png')
    plt.savefig(file_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print(f"Generated: {file_path}")


# ==============================================================================
# CHART 4: 50-Question Diagnostic Accuracy Strip
# ==============================================================================
def generate_question_accuracy_strip():
    fig, ax = plt.subplots(figsize=(15, 7.5), facecolor=COLOR_BG)
    ax.set_facecolor(COLOR_CARD_BG)

    # Discrete question scores based on the audit report
    q_numbers = np.arange(1, 51)
    scores = [100] * 50

    # Specific recorded variances:
    # Q19: 95%, Q20: 70%, Q22: 95%, Q30: 85%
    scores[18] = 95.0   # Q19
    scores[19] = 70.0   # Q20
    scores[21] = 95.0   # Q22
    scores[29] = 85.0   # Q30

    # Background tier shading
    ax.axvspan(0.5, 15.5, color='#F1F5F9', alpha=0.7, zorder=1)
    ax.axvspan(15.5, 35.5, color='#FFFFFF', alpha=0.7, zorder=1)
    ax.axvspan(35.5, 50.5, color='#F8FAFC', alpha=0.7, zorder=1)

    # Labels for Tier boundaries with card badge styling
    tier_pill = dict(boxstyle='round,pad=0.4', facecolor='#FFFFFF', edgecolor='#CBD5E1', alpha=0.95, linewidth=1.2)
    ax.text(8.0, 50, 'LEVEL 1: EASY (Q1–Q15)\n100% Accuracy', ha='center', va='center', fontsize=9, fontweight='bold', color=COLOR_SLATE_DARK, bbox=tier_pill, zorder=7)
    ax.text(25.5, 50, 'LEVEL 2: MEDIUM (Q16–Q35)\n94.0% Accuracy', ha='center', va='center', fontsize=9, fontweight='bold', color=COLOR_SLATE_DARK, bbox=tier_pill, zorder=7)
    ax.text(43.0, 50, 'LEVEL 3: HARD (Q36–Q50)\n99.0% Accuracy', ha='center', va='center', fontsize=9, fontweight='bold', color=COLOR_SLATE_DARK, bbox=tier_pill, zorder=7)

    # Plot baseline 100% guide
    ax.axhline(100.0, color=COLOR_GRID, linestyle='-', linewidth=1.2, zorder=2)
    ax.axhline(95.0, color=COLOR_EMERALD, linestyle='--', linewidth=1.0, alpha=0.7, zorder=2)

    # Point colors
    point_colors = []
    for s in scores:
        if s == 100:
            point_colors.append(COLOR_EMERALD)
        elif s >= 95:
            point_colors.append(COLOR_AMBER)
        elif s >= 85:
            point_colors.append(COLOR_ORANGE)
        else:
            point_colors.append(COLOR_RED)

    # Stem plot style drop-lines
    for q, s, c in zip(q_numbers, scores, point_colors):
        ax.plot([q, q], [44, s], color=COLOR_GRID, linewidth=1.2, zorder=3)

    # Scatter points
    scatter = ax.scatter(
        q_numbers,
        scores,
        c=point_colors,
        s=85,
        edgecolors=COLOR_GRAPHITE,
        linewidth=1.2,
        zorder=5
    )

    # Annotations for edge cases
    ax.annotate(
        'Q20: 70%\n(Promoter Sum Rollover)',
        xy=(20, 70), xytext=(20, 61),
        arrowprops=dict(facecolor=COLOR_RED, shrink=0.08, width=1, headwidth=5),
        fontsize=8.5, fontweight='bold', ha='center', color=COLOR_RED,
        bbox=dict(boxstyle='round,pad=0.2', facecolor='#FEF2F2', edgecolor=COLOR_RED, alpha=0.9)
    )

    ax.annotate(
        'Q30: 85%\n(Neopolis Verdict)',
        xy=(30, 85), xytext=(30, 77),
        arrowprops=dict(facecolor=COLOR_ORANGE, shrink=0.08, width=1, headwidth=5),
        fontsize=8.5, fontweight='bold', ha='center', color='#C2410C',
        bbox=dict(boxstyle='round,pad=0.2', facecolor='#FFF7ED', edgecolor=COLOR_ORANGE, alpha=0.9)
    )

    ax.annotate(
        'Q19: 95%\n(Work %)',
        xy=(19, 95), xytext=(16.8, 86),
        arrowprops=dict(facecolor=COLOR_AMBER, shrink=0.08, width=1, headwidth=5),
        fontsize=8.5, fontweight='bold', ha='center', color='#B45309',
        bbox=dict(boxstyle='round,pad=0.2', facecolor='#FFFBEB', edgecolor=COLOR_AMBER, alpha=0.9)
    )

    ax.annotate(
        'Q22: 95%\n(OC Cross-Ref)',
        xy=(22, 95), xytext=(24.2, 86),
        arrowprops=dict(facecolor=COLOR_AMBER, shrink=0.08, width=1, headwidth=5),
        fontsize=8.5, fontweight='bold', ha='center', color='#B45309',
        bbox=dict(boxstyle='round,pad=0.2', facecolor='#FFFBEB', edgecolor=COLOR_AMBER, alpha=0.9)
    )

    # Annotate Hallucination Traps
    traps = [(36, 'Q36: Park Grove Collapse'), (39, 'Q39: CHS Apex Ruling'), (43, 'Q43: Alabal Penalty'), (49, 'Q49: AAI 150m NOC')]
    for q_trap, label in traps:
        ax.scatter([q_trap], [100], s=170, facecolors='none', edgecolors=COLOR_BLUE, linewidth=2.0, zorder=6)
        y_text = 102.5 if q_trap == 49 else 103.5
        ax.text(q_trap, y_text, 'TRAP\nCAUGHT', ha='center', va='bottom', fontsize=7.5, fontweight='black', color=COLOR_BLUE)

    # Annotate Adversarial Security Redaction Block (Q47) with staggered vertical offset
    ax.scatter([47], [100], s=170, facecolors='none', edgecolors='#9333EA', linewidth=2.0, zorder=6)
    ax.text(47, 107.5, 'PII\nBLOCKED', ha='center', va='bottom', fontsize=7.5, fontweight='black', color='#9333EA')
    ax.plot([47, 47], [101.5, 107.0], color='#9333EA', linestyle=':', linewidth=1.2, zorder=4)

    ax.set_xlim(0, 51)
    ax.set_ylim(44, 116)
    ax.set_xticks(q_numbers)
    ax.set_xticklabels([f"Q{i}" for i in q_numbers], rotation=90, fontsize=8, fontweight='medium', color=COLOR_SLATE_DARK)
    ax.set_ylabel('Accuracy Score (%)', fontsize=11, fontweight='bold', color=COLOR_SLATE_DARK)
    ax.yaxis.set_major_formatter(PercentFormatter(100))
    ax.grid(axis='both', linestyle='--', alpha=0.4, color=COLOR_GRID, zorder=0)

    # Title & Legend
    ax.text(
        -0.02, 1.14,
        'Itemized 50-Question Diagnostic Accuracy Strip & Adversarial Defense Audit',
        transform=ax.transAxes,
        fontsize=14.5,
        fontweight='black',
        color=COLOR_GRAPHITE
    )
    ax.text(
        -0.02, 1.07,
        'Tracking Discrete Accuracy, 4 Fictitious Hallucination Traps, and Complainant PII Redaction Interception',
        transform=ax.transAxes,
        fontsize=10.5,
        fontweight='normal',
        color=COLOR_SLATE_MED
    )

    # Custom Legend cleanly placed below the plot
    legend_elements = [
        mpatches.Patch(color=COLOR_EMERALD, label='100% Grounded Fact Match (46 Queries)'),
        mpatches.Patch(color=COLOR_AMBER, label='95% Minor Filtering Boundary Variance (Q19, Q22)'),
        mpatches.Patch(color=COLOR_ORANGE, label='85% Partial Discrepancy Classification (Q30)'),
        mpatches.Patch(color=COLOR_RED, label='70% Promoter-Level Sum Rollover (Q20)'),
        plt.Line2D([0], [0], marker='o', color='w', markeredgecolor=COLOR_BLUE, markeredgewidth=2, markersize=10, label='Neutralized Hallucination Traps (Q36, Q39, Q43, Q49)'),
        plt.Line2D([0], [0], marker='o', color='w', markeredgecolor='#9333EA', markeredgewidth=2, markersize=10, label='DPDPA PII Redaction Intercept (Q47)')
    ]
    ax.legend(
        handles=legend_elements,
        loc='upper center',
        bbox_to_anchor=(0.5, -0.15),
        ncol=3,
        framealpha=0.98,
        edgecolor=COLOR_GRID,
        fontsize=8.5
    )

    file_path = os.path.join(output_dir, 'question_accuracy_strip.png')
    plt.savefig(file_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print(f"Generated: {file_path}")


if __name__ == '__main__':
    print("==================================================")
    print("Generating REAA Audit Visualization Asset Suite...")
    print("==================================================")
    generate_benchmark_vs_actual()
    generate_tier_difficulty_performance()
    generate_data_routing_distribution()
    generate_question_accuracy_strip()
    print("==================================================")
    print("All 4 audit visualization assets successfully created in audit_charts/")
    print("==================================================")
