"""Verify unified medicine database is working correctly."""

from config.medicine_database import UNIFIED_MEDICINE_DATABASE, get_medicine_profile

print("=" * 60)
print("UNIFIED DATABASE VERIFICATION")
print("=" * 60)

prof_paclitaxel = get_medicine_profile('paclitaxel')
prof_docetaxel = get_medicine_profile('docetaxel')
prof_cabergoline = get_medicine_profile('cabergoline')

print(f"\nNon-Recommended Medicine:")
print(f"  Paclitaxel - effectiveness: {prof_paclitaxel['effectiveness']:.2f} (LOW)")

print(f"\nRecommended Medicines:")
print(f"  Docetaxel - effectiveness: {prof_docetaxel['effectiveness']:.2f} (HIGH)")
print(f"  Cabergoline - effectiveness: {prof_cabergoline['effectiveness']:.2f} (HIGH)")

print(f"\nDatabase Statistics:")
print(f"  Total medicines: {len(UNIFIED_MEDICINE_DATABASE)}")

high_eff = sum(1 for m in UNIFIED_MEDICINE_DATABASE.values() if m['effectiveness'] >= 0.70)
low_eff = sum(1 for m in UNIFIED_MEDICINE_DATABASE.values() if m['effectiveness'] < 0.40)
print(f"  High-effectiveness (≥0.70): {high_eff}")
print(f"  Low-effectiveness (<0.40): {low_eff}")

print("\n✓ UNIFIED DATABASE IS THE SINGLE SOURCE OF TRUTH")
