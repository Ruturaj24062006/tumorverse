"""Unified Medicine Database - Used by both Recommendation and Simulation modules.

This is the single source of truth for cancer medicine parameters.
Both Module 4 (Simulation) and Module 5 (Recommendation) import from this file.
"""

from typing import Dict

# ============================================================================
# UNIFIED MEDICINE DATABASE
# ============================================================================
# Format: {
#     "medicine_name": {
#         "k": decay constant (0.008-0.090),
#         "effectiveness": effectiveness score (0-1),  # HIGH for recommended, LOW for non-recommended
#         "dosage_sensitivity": dosage multiplier (0.75-1.10)
#     }
# }
#
# EFFECTIVENESS RANGES:
# - Recommended medicines: 0.70-0.95 (high confidence)
# - Non-recommended medicines: 0.10-0.40 (low confidence)
# ============================================================================

UNIFIED_MEDICINE_DATABASE: Dict[str, Dict[str, float]] = {
    # =========================================================================
    # HIGH-EFFECTIVENESS RECOMMENDED MEDICINES (Confidence: 70-95%)
    # =========================================================================
    # LUAD recommended
    "docetaxel": {
        "k": 0.055,
        "effectiveness": 0.78,
        "dosage_sensitivity": 1.05,
    },
    "pembrolizumab": {
        "k": 0.045,
        "effectiveness": 0.72,
        "dosage_sensitivity": 0.95,
    },
    "gefitinib": {
        "k": 0.035,
        "effectiveness": 0.70,
        "dosage_sensitivity": 0.90,
    },
    # BRCA recommended
    "tamoxifen": {
        "k": 0.024,
        "effectiveness": 0.72,
        "dosage_sensitivity": 0.78,
    },
    # COREAD recommended (updated to be high-effectiveness)
    "cisplatin": {
        "k": 0.045,
        "effectiveness": 0.75,
        "dosage_sensitivity": 0.90,
    },
    # GBM recommended - HIGHEST effectiveness
    "cabergoline": {
        "k": 0.080,
        "effectiveness": 0.90,
        "dosage_sensitivity": 1.10,
    },
    "octreotide": {
        "k": 0.060,
        "effectiveness": 0.80,
        "dosage_sensitivity": 1.00,
    },
    "pasireotide": {
        "k": 0.050,
        "effectiveness": 0.75,
        "dosage_sensitivity": 0.95,
    },
    # KIRC recommended
    "nivolumab": {
        "k": 0.042,
        "effectiveness": 0.70,
        "dosage_sensitivity": 0.94,
    },
    # =========================================================================
    # LOW-EFFECTIVENESS NON-RECOMMENDED MEDICINES (Confidence: 10-40%)
    # Used for comparison/baseline
    # =========================================================================
    "paclitaxel": {
        "k": 0.008,  # Very low decay constant
        "effectiveness": 0.15,  # Very low effectiveness
        "dosage_sensitivity": 0.75,
    },
    "imatinib": {
        "k": 0.028,
        "effectiveness": 0.35,
        "dosage_sensitivity": 0.85,
    },
    "gemcitabine": {
        "k": 0.012,
        "effectiveness": 0.22,
        "dosage_sensitivity": 0.80,
    },
    # =========================================================================
    # ADDITIONAL MEDICINES WITH MEDIUM EFFECTIVENESS (For testing)
    # =========================================================================
    "sorafenib": {
        "k": 0.035,
        "effectiveness": 0.62,
        "dosage_sensitivity": 0.94,
    },
    "nexavar": {
        "k": 0.033,
        "effectiveness": 0.60,
        "dosage_sensitivity": 0.92,
    },
    "lenvatinib": {
        "k": 0.040,
        "effectiveness": 0.69,
        "dosage_sensitivity": 1.00,
    },
    "everolimus": {
        "k": 0.032,
        "effectiveness": 0.58,
        "dosage_sensitivity": 0.86,
    },
    "enzalutamide": {
        "k": 0.030,
        "effectiveness": 0.66,
        "dosage_sensitivity": 0.93,
    },
    "abiraterone": {
        "k": 0.033,
        "effectiveness": 0.64,
        "dosage_sensitivity": 0.90,
    },
    "vemurafenib": {
        "k": 0.040,
        "effectiveness": 0.74,
        "dosage_sensitivity": 1.05,
    },
    "dabrafenib": {
        "k": 0.041,
        "effectiveness": 0.73,
        "dosage_sensitivity": 1.04,
    },
    "olaparib": {
        "k": 0.037,
        "effectiveness": 0.70,
        "dosage_sensitivity": 0.98,
    },
    "trastuzumab": {
        "k": 0.035,
        "effectiveness": 0.66,
        "dosage_sensitivity": 0.90,
    },
    "cetuximab": {
        "k": 0.048,
        "effectiveness": 0.63,
        "dosage_sensitivity": 0.92,
    },
    "temozolomide": {
        "k": 0.050,
        "effectiveness": 0.86,
        "dosage_sensitivity": 0.96,
    },
    "bevacizumab": {
        "k": 0.045,
        "effectiveness": 0.74,
        "dosage_sensitivity": 0.95,
    },
    "lomustine": {
        "k": 0.050,
        "effectiveness": 0.68,
        "dosage_sensitivity": 0.96,
    },
    "ipilimumab": {
        "k": 0.034,
        "effectiveness": 0.62,
        "dosage_sensitivity": 0.85,
    },
    "oxaliplatin": {
        "k": 0.058,
        "effectiveness": 0.64,
        "dosage_sensitivity": 0.95,
    },
}

# ============================================================================
# CANCER-TYPE -> RECOMMENDED MEDICINES MAPPING
# Each cancer type gets a list of recommended medicines (high effectiveness)
# ============================================================================

CANCER_RECOMMENDED: Dict[str, list[str]] = {
    "LUAD": ["docetaxel", "pembrolizumab", "gefitinib"],         # Lung adenocarcinoma
    "BRCA": ["tamoxifen", "docetaxel", "pembrolizumab"],         # Breast cancer
    "COREAD": ["cisplatin", "docetaxel", "oxaliplatin"],         # Colorectal cancer
    "GBM": ["temozolomide", "bevacizumab", "lomustine"],         # Glioblastoma
    "KIRC": ["nivolumab", "pembrolizumab", "cabergoline"],       # Kidney cancer
    "PITUITARY": ["cabergoline", "octreotide", "pasireotide"],   # Pituitary cancer
}

# ============================================================================
# FALLBACK/UNKNOWN MEDICINE GENERATION
# When a medicine is not in the database, generate deterministic parameters
# ============================================================================

def get_medicine_profile(medicine_name: str) -> Dict[str, float]:
    """
    Get medicine kinetics profile from unified database.
    Returns high or low parameters deterministically for unknown medicines.
    """
    import hashlib
    
    normalized = (medicine_name or "").strip().lower()
    
    # Check if in unified database
    if normalized in UNIFIED_MEDICINE_DATABASE:
        return dict(UNIFIED_MEDICINE_DATABASE[normalized])
    
    # Fallback: generate deterministically based on medicine name hash
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    bucket = int(digest[:8], 16) % 1000 / 1000.0
    
    # Generate LOW-effectiveness defaults for unknown medicines
    # This ensures unknown medicines don't accidentally have high effectiveness
    return {
        "k": 0.006 + (0.010 * bucket),
        "effectiveness": 0.10 + (0.25 * bucket),  # Range: 0.10-0.35 (LOW)
        "dosage_sensitivity": 0.60 + (0.30 * bucket),
    }


def get_medicines_for_cancer(cancer_type: str) -> list[str]:
    """Get recommended medicines for a specific cancer type."""
    text = (cancer_type or "").strip().upper()
    if "GBM" in text or "GLIOMA" in text:
        normalized = "GBM"
    elif "LUAD" in text or "LUNG" in text:
        normalized = "LUAD"
    elif "BRCA" in text or "BREAST" in text:
        normalized = "BRCA"
    elif "COREAD" in text or "COLON" in text or "COLO" in text:
        normalized = "COREAD"
    elif "KIRC" in text or "KIDNEY" in text:
        normalized = "KIRC"
    elif "PITUITARY" in text:
        normalized = "PITUITARY"
    elif "MELANOMA" in text or "SKIN" in text:
        normalized = "MELANOMA"
    else:
        normalized = text
    return CANCER_RECOMMENDED.get(normalized, ["docetaxel", "pembrolizumab", "cabergoline"])


def is_medicine_recommended(medicine_name: str, cancer_type: str) -> bool:
    """Check if a medicine is recommended for a specific cancer type."""
    normalized_med = (medicine_name or "").strip().lower()
    recommended_medicines = set(med.lower() for med in get_medicines_for_cancer(cancer_type))
    return normalized_med in recommended_medicines
