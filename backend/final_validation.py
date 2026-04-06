"""Final validation: Module 5 recommendations correctly influence Module 4 simulation."""

import requests

print("=" * 70)
print("FINAL VALIDATION: Module 5 (Recommendation) ↔ Module 4 (Simulation)")
print("=" * 70)

test_cases = [
    {"medicine": "cabergoline", "cancer": "GBM", "expected_status": "RECOMMENDED", "expect_high": True},
    {"medicine": "octreotide", "cancer": "GBM", "expected_status": "RECOMMENDED", "expect_high": True},
    {"medicine": "paclitaxel", "cancer": "GBM", "expected_status": "NOT RECOMMENDED", "expect_high": False},
    {"medicine": "docetaxel", "cancer": "LUAD", "expected_status": "RECOMMENDED", "expect_high": True},
    {"medicine": "imatinib", "cancer": "LUAD", "expected_status": "NOT RECOMMENDED", "expect_high": False},
]

for test in test_cases:
    payload = {
        "cell_line": "A549",
        "cancer_type": test["cancer"],
        "pathway": "test",
        "target": "test",
        "tumor_size": 30,
        "dosage": 50,
        "medicine": test["medicine"]
    }
    
    try:
        resp = requests.post("http://127.0.0.1:8000/recommend", json=payload)
        data = resp.json()
        
        med = test["medicine"]
        conf = float(data["confidence"])
        reduction = float(data["tumor_reduction"])
        recommended = data["recommended"]
        
        # Validation check
        if test["expect_high"]:
            status = "✓ PASS" if (conf >= 0.60 and reduction >= 5) else "✗ FAIL"
        else:
            status = "✓ PASS" if (conf <= 0.40 and reduction <= 5) else "✗ FAIL"
        
        print(f"\n{med.upper()} for {test['cancer']}:")
        print(f"  Recommendation: {test['expected_status']} (recommended={recommended})")
        print(f"  Confidence: {conf:.2f} (from medicine effectiveness)")
        print(f"  6-month Reduction: {reduction:.2f}%")
        print(f"  Validation: {status}")
        
    except Exception as e:
        print(f"\nERROR testing {test['medicine']}: {str(e)}")

print("\n" + "=" * 70)
print("CONSISTENCY CHECK COMPLETE")
print("=" * 70)
