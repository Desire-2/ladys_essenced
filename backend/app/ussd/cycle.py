from datetime import date, datetime
from statistics import mean

from app.models import CycleLog
from app.routes.cycle_logs import CyclePredictionEngine


def _format_iso_date(value, fmt='%d %b %Y'):
    try:
        if isinstance(value, str):
            return datetime.fromisoformat(value.replace('Z', '+00:00')).strftime(fmt)
        return value.strftime(fmt)
    except Exception:
        return str(value)


def get_ussd_cycle_predictions(user):
    """Get cycle predictions using the ML engine (same as REST API)."""
    cycle_logs = CycleLog.query.filter_by(
        user_id=user.id
    ).order_by(CycleLog.start_date.asc()).all()

    if not cycle_logs:
        return "END No cycle data yet. Log a period first."

    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(cycle_logs)

    if not cycle_data.get('lengths'):
        return (
            "END Need at least 2 logged periods\n"
            "to generate predictions."
        )

    predictions = CyclePredictionEngine.predict_next_cycles(
        cycle_logs, num_predictions=2
    )

    if not predictions.get('predictions'):
        return "END Could not generate predictions. Log more periods."

    pred1 = predictions['predictions'][0]
    confidence = pred1.get('confidence', 'low')
    next_start = pred1.get('predicted_start', 'Unknown')
    fertile_start = pred1.get('fertile_window_start', '')
    fertile_end = pred1.get('fertile_window_end', '')

    next_start_fmt = _format_iso_date(next_start)

    period_lengths = CyclePredictionEngine.compute_period_lengths(cycle_logs)
    anomalies = CyclePredictionEngine.detect_health_anomalies(cycle_data, period_lengths)

    response = (
        f"CON 🔮 Your Predictions:\n"
        f"Next period: {next_start_fmt}\n"
        f"Confidence: {confidence.upper()}\n"
    )

    if fertile_start and fertile_end:
        try:
            fs = _format_iso_date(fertile_start, '%d %b')
            fe = _format_iso_date(fertile_end, '%d %b')
            response += f"Fertile window: {fs}-{fe}\n"
        except Exception:
            pass

    if anomalies.get('risk_level') in ('medium', 'high'):
        response += "⚠ Health pattern alert detected\n"

    response += "\n1. More details\n0. Back"
    return response


def get_ussd_cycle_stats(user):
    """Get cycle statistics using the ML engine."""
    cycle_logs = CycleLog.query.filter_by(
        user_id=user.id
    ).order_by(CycleLog.start_date.asc()).all()

    if len(cycle_logs) < 2:
        return (
            f"CON Not enough data yet.\n"
            f"You have {len(cycle_logs)} log(s).\n"
            "Log more periods to see stats.\n0. Back"
        )

    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(cycle_logs)
    lengths = cycle_data.get('lengths', [])

    if not lengths:
        return "CON No valid cycle data.\n0. Back"

    avg = round(mean(lengths), 1)
    regularity = CyclePredictionEngine.compute_regularity_index(lengths)
    confidence = CyclePredictionEngine.compute_confidence_score(cycle_data)

    reg_score = regularity.get('score', 0)
    reg_label = regularity.get('label', 'unknown').replace('_', ' ')

    period_lengths = CyclePredictionEngine.compute_period_lengths(cycle_logs)
    avg_period = round(mean(period_lengths), 1) if period_lengths else 'N/A'

    return (
        f"CON 📊 Your Cycle Stats:\n"
        f"Avg cycle: {avg} days\n"
        f"Avg period: {avg_period} days\n"
        f"Regularity: {reg_score:.0f}% ({reg_label})\n"
        f"Cycles tracked: {len(lengths)}\n"
        f"Confidence: {confidence.get('level', 'low')}\n"
        f"\n0. Back\n00. Main Menu"
    )


def get_ussd_anomaly_report(user):
    """Run anomaly detection — same as web dashboard."""
    cycle_logs = CycleLog.query.filter_by(
        user_id=user.id
    ).order_by(CycleLog.start_date.asc()).all()

    if len(cycle_logs) < 2:
        return "CON Not enough data for anomaly check.\n0. Back"

    cycle_data = CyclePredictionEngine.extract_cycle_lengths_robust(cycle_logs)
    period_lengths = CyclePredictionEngine.compute_period_lengths(cycle_logs)
    anomalies = CyclePredictionEngine.detect_health_anomalies(cycle_data, period_lengths)

    if not anomalies.get('anomalies'):
        return (
            "CON ✅ No health alerts.\n"
            "Your cycle patterns look normal.\n0. Back"
        )

    lines = [f"⚠ {anomalies['risk_level'].upper()} risk detected:\n"]
    for anomaly in anomalies['anomalies'][:2]:
        lines.append(f"- {anomaly.get('message', 'Pattern change detected')}\n")
    lines.append("\nConsider seeing a health provider.\n0. Back")

    return "CON " + "".join(lines)


def get_prediction_details(user):
    """Extended prediction view for submenu."""
    cycle_logs = CycleLog.query.filter_by(
        user_id=user.id
    ).order_by(CycleLog.start_date.asc()).all()

    predictions = CyclePredictionEngine.predict_next_cycles(cycle_logs, num_predictions=2)
    preds = predictions.get('predictions', [])

    if not preds:
        return "CON No predictions available.\n0. Back"

    lines = ["CON 🔮 Upcoming cycles:\n"]
    for idx, pred in enumerate(preds[:2], 1):
        start = _format_iso_date(pred.get('predicted_start', ''))
        conf = pred.get('confidence', 'low')
        lines.append(f"{idx}. {start} ({conf})\n")

    lines.append("\n0. Back")
    return "".join(lines)
