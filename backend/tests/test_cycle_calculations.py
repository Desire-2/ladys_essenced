import pytest
from datetime import date
from unittest.mock import MagicMock


def make_mock_log(start, end, flow='medium', symptoms=''):
    log = MagicMock()
    log.start_date = date.fromisoformat(start)
    log.end_date = date.fromisoformat(end)
    log.flow_intensity = flow
    log.symptoms = symptoms
    log.mood = None
    log.stress_level = None
    return log


# Uwase's real data from the screenshots
UWASE_LOGS = [
    make_mock_log('2026-01-27', '2026-01-31', 'medium', 'Headache, Cramps, Mood Swings'),
    make_mock_log('2026-02-18', '2026-02-22', 'medium', 'cramps, Headache, Mood Swings, Back Pain'),
    make_mock_log('2026-03-10', '2026-03-14', 'medium', 'cramps, Headache, Cramps'),
    make_mock_log('2026-04-02', '2026-04-06', 'medium', 'headache, Headache, Mood Swings'),
    make_mock_log('2026-04-23', '2026-04-27', 'medium', 'Headache, Mood Swings'),
    make_mock_log('2026-05-11', '2026-05-16', 'medium', 'Mood Swings, Back Pain, Fatigue / Tiredness'),
]


class TestCycleExtraction:
    def test_cycle_lengths_computed_from_start_dates(self):
        """The fundamental correctness test."""
        from app.routes.cycle_logs import CyclePredictionEngine
        result = CyclePredictionEngine.extract_cycle_lengths_robust(UWASE_LOGS)

        assert result['lengths'] == [22, 20, 23, 21, 18], \
            f"Expected [22, 20, 23, 21, 18], got {result['lengths']}"

    def test_average_cycle_length_is_not_32(self):
        """The dashboard was showing 32 — this must never happen again."""
        from app.routes.cycle_logs import CyclePredictionEngine
        import statistics
        result = CyclePredictionEngine.extract_cycle_lengths_robust(UWASE_LOGS)
        mean = statistics.mean(result['lengths'])
        assert abs(mean - 20.8) < 0.5, \
            f"Average should be ~20.8 days, got {mean}. Dashboard must NOT show 32."

    def test_period_lengths_correct(self):
        from app.routes.cycle_logs import CyclePredictionEngine
        lengths = CyclePredictionEngine.compute_period_lengths(UWASE_LOGS)
        assert all(4 <= length <= 5 for length in lengths), \
            f"Period lengths should be 4-5 days, got {lengths}"

    def test_regularity_reflects_short_consistent_cycles(self):
        """Uwase has CONSISTENT cycles (CV ~8.5%) — regularity should be HIGH."""
        from app.routes.cycle_logs import CyclePredictionEngine
        result = CyclePredictionEngine.extract_cycle_lengths_robust(UWASE_LOGS)
        reg = CyclePredictionEngine.compute_regularity_index(result['lengths'])
        assert reg['score'] >= 75, \
            f"Regularity should be ≥75 for consistent cycles, got {reg['score']}"

    def test_prediction_base_date_correct(self):
        """Next predicted period should be ~20.8 days after May 11."""
        from app.routes.cycle_logs import CyclePredictionEngine
        result = CyclePredictionEngine.predict_next_cycles(UWASE_LOGS, num_predictions=1)
        pred = result['predictions'][0]
        pred_start = date.fromisoformat(pred['predicted_start'])
        assert date(2026, 5, 28) <= pred_start <= date(2026, 6, 8), \
            f"Predicted start {pred_start} seems wrong given ~21-day cycle from May 11"

    def test_no_false_outliers_on_consistent_short_cycles(self):
        """Cycles of 18-23 days should NOT be flagged as outliers for this user."""
        from app.routes.cycle_logs import CyclePredictionEngine
        result = CyclePredictionEngine.extract_cycle_lengths_robust(UWASE_LOGS)
        outlier_result = CyclePredictionEngine.detect_outliers_adaptive(result['lengths'])
        assert len(outlier_result['outliers']) == 0, \
            f"No cycles should be outliers for this consistent user. Got: {outlier_result['outliers']}"

    def test_stored_cycle_length_field_not_used(self):
        """Regression test: even if stored cycle_length is wrong, result is correct."""
        logs_with_bad_stored_field = UWASE_LOGS.copy()
        for log in logs_with_bad_stored_field:
            log.cycle_length = 32

        from app.routes.cycle_logs import CyclePredictionEngine
        result = CyclePredictionEngine.extract_cycle_lengths_robust(logs_with_bad_stored_field)
        import statistics
        mean = statistics.mean(result['lengths'])
        assert mean < 25, \
            f"Stored cycle_length=32 should be ignored. Mean was {mean}"
