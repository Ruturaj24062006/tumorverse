"""Medicine-specific tumor shrink simulation using exponential kinetics."""

from __future__ import annotations

import hashlib
import math
from typing import Dict, Tuple

from config.medicine_database import get_medicine_profile


class MedicineSimulator:
    """Simulates medicine response from medicine kinetics and dosage over time."""

    @staticmethod
    def _stable_bucket_code(text: str, bucket_size: int = 100) -> int:
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
        return int(digest[:8], 16) % bucket_size

    @classmethod
    def _resolve_medicine_kinetics(cls, medicine_type: str) -> Dict[str, float]:
        """Resolve medicine kinetics from unified database.
        
        Uses the unified medicine database which ensures consistency
        between recommendation and simulation modules.
        """
        return get_medicine_profile(medicine_type)

    @staticmethod
    def _normalize_dosage(dosage: float) -> float:
        return max(0.1, min(3.0, float(dosage) / 50.0))

    @staticmethod
    def _tumor_burden_factor(tumor_size: float) -> float:
        # Larger tumors are harder to control due to burden and heterogeneity.
        return 1.0 + 0.35 * math.log1p(max(0.0, float(tumor_size)))

    def simulate_tumor(self, tumor_size: float, medicine: str, dosage: float, months: float) -> Tuple[float, float]:
        """Return simulated tumor size and percentage reduction at a given month horizon."""
        initial_size = max(0.01, float(tumor_size))
        time_months = max(0.0, float(months))
        dosage_term = self._normalize_dosage(dosage)
        profile = self._resolve_medicine_kinetics(medicine)

        k = max(0.0001, float(profile["k"]))
        effectiveness = max(0.01, min(1.0, float(profile["effectiveness"])))
        dosage_sensitivity = max(0.1, float(profile["dosage_sensitivity"]))
        burden_factor = self._tumor_burden_factor(initial_size)

        # tumor_size(t) = initial_size * exp(-k * dosage * time)
        effective_rate = (k * effectiveness * dosage_term * dosage_sensitivity) / burden_factor
        new_size = initial_size * math.exp(-effective_rate * time_months)
        reduction_pct = max(0.0, min(100.0, (1.0 - (new_size / initial_size)) * 100.0))
        return new_size, reduction_pct

    def recovery_time(self, tumor_size: float, medicine: str, dosage: float, target_reduction: float) -> float:
        """Return months required to reach a target percentage reduction."""
        target = max(0.0, min(99.0, float(target_reduction))) / 100.0
        if target <= 0.0:
            return 0.0

        initial_size = max(0.01, float(tumor_size))
        dosage_term = self._normalize_dosage(dosage)
        profile = self._resolve_medicine_kinetics(medicine)

        k = max(0.0001, float(profile["k"]))
        effectiveness = max(0.01, min(1.0, float(profile["effectiveness"])))
        dosage_sensitivity = max(0.1, float(profile["dosage_sensitivity"]))
        burden_factor = self._tumor_burden_factor(initial_size)
        effective_rate = (k * effectiveness * dosage_term * dosage_sensitivity) / burden_factor

        if effective_rate <= 1e-9:
            return 120.0

        months = -math.log(1.0 - target) / effective_rate
        return max(0.0, min(120.0, months))

    @staticmethod
    def _time_for_reduction(target_fraction: float, rate: float) -> float:
        if rate <= 1e-9:
            return 120.0
        return max(0.0, min(120.0, -math.log(1.0 - target_fraction) / rate))

    def simulate_response(self, tumor_size: float, medicine_type: str, dosage: float) -> Dict[str, object]:
        profile = self._resolve_medicine_kinetics(medicine_type)
        horizon_months = 6.0
        final_size, tumor_reduction = self.simulate_tumor(
            tumor_size=tumor_size,
            medicine=medicine_type,
            dosage=dosage,
            months=horizon_months,
        )

        long_horizon_months = 120.0
        long_horizon_size, long_horizon_reduction = self.simulate_tumor(
            tumor_size=tumor_size,
            medicine=medicine_type,
            dosage=dosage,
            months=long_horizon_months,
        )
        complete_response_possible = float(long_horizon_reduction) >= 99.9

        recovery_months = {
            "25%": round(self.recovery_time(tumor_size, medicine_type, dosage, 25.0), 4),
            "50%": round(self.recovery_time(tumor_size, medicine_type, dosage, 50.0), 4),
            "75%": round(self.recovery_time(tumor_size, medicine_type, dosage, 75.0), 4),
        }

        return {
            "medicine": (medicine_type or "unknown").strip().lower(),
            "tumor_reduction": round(tumor_reduction, 4),
            "recovery_months": recovery_months,
            "projected_tumor_size": round(float(final_size), 4),
            "max_projected_reduction": round(float(long_horizon_reduction), 4),
            "complete_response_possible": complete_response_possible,
            "complete_response_note": (
                "Near-complete response is achievable within the long-horizon simulation window."
                if complete_response_possible
                else "Literal 100% reduction is not reached within the model horizon; response remains asymptotic."
            ),
            "kinetics": {
                "k": round(float(profile["k"]), 5),
                "effectiveness": round(float(profile["effectiveness"]), 4),
                "dosage_sensitivity": round(float(profile["dosage_sensitivity"]), 4),
            },
            "model": "rule_based_exponential_decay",
            "equation": "tumor_size(t) = initial_size * exp(-k * effectiveness * dosage * sensitivity * time / burden)",
        }

    def predict_reduction(self, tumor_size: float, medicine_type: str, dosage: float) -> Tuple[float, float]:
        response = self.simulate_response(tumor_size=tumor_size, medicine_type=medicine_type, dosage=dosage)
        tumor_reduction = float(response["tumor_reduction"])
        confidence = float(response["kinetics"]["effectiveness"])
        return tumor_reduction, confidence


medicine_simulator = MedicineSimulator()
