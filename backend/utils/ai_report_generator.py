"""AI-driven medical report generation for TumorVerse.

Generates professional AI medical simulation reports in:
- Markdown format (for frontend display)
- JSON format (for APIs)
- HTML format (for web viewing)

Reports include:
- Patient/Tumor characteristics
- Segmentation analysis
- Cancer classification
- Tumor size and aggressiveness
- Recommended medicines with mechanisms
- Treatment effectiveness analysis
- Recovery timeline predictions
- Tumor evolution predictions
- Risk stratification
- AI clinical recommendations
- Treatment status summary
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Any

import json
from datetime import datetime
import base64
from io import BytesIO


@dataclass(frozen=True)
class ReportInput:
    """Input data for report generation."""
    # Patient/tumor identification
    cancer_type: str
    tumor_size: float  # mm
    aggressiveness: str
    
    # Medical analysis
    segmentation_confidence: float
    treatment_score: float
    effectiveness: float
    recovery_status: str
    recovery_speed: str
    
    # Treatment
    medicine: str
    medicine_effectiveness: float
    
    # Risk/State
    medical_state: str
    risk_level: str
    risk_score: float
    
    # Explanations
    medicine_explanation: str
    recovery_explanation: str
    aggressiveness_explanation: str
    evolution_explanation: str
    
    # Risk details
    recurrence_risk: float
    progression_risk: float
    treatment_resistance_prob: float
    
    # Optional additional fields
    report_title: str = "AI Medical Simulation Report"
    facility_name: str = "TumorVerse AI Medical Digital Twin Platform"
    clinician_note: str = ""


@dataclass(frozen=True)
class MedicalReport:
    """Generated medical report."""
    report_id: str
    generated_timestamp: str
    markdown_report: str
    json_report: Dict[str, Any]
    html_report: str
    pdf_report_base64: Optional[str] = None  # Base64 encoded PDF or HTML fallback


class AIReportGenerator:
    """Generate professional medical simulation reports."""

    @staticmethod
    def _get_current_timestamp() -> str:
        """Get current timestamp in medical format."""
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    @staticmethod
    def _generate_report_id() -> str:
        """Generate unique report ID."""
        import uuid
        return f"TVDTWIN-{uuid.uuid4().hex[:12].upper()}"

    @staticmethod
    def _generate_markdown_report(input_data: ReportInput) -> str:
        """Generate markdown format report."""
        timestamp = AIReportGenerator._get_current_timestamp()
        
        md_report = f"""# {input_data.report_title}

**Facility:** {input_data.facility_name}  
**Generated:** {timestamp}  
**Platform:** TumorVerse AI Digital Tumor Twin System

---

## PATIENT & TUMOR CHARACTERISTICS

### Tumor Classification
- **Primary Cancer Type:** {input_data.cancer_type}
- **Tumor Size:** {input_data.tumor_size:.1f} mm
- **Aggressiveness Level:** {input_data.aggressiveness.capitalize()}
- **Medical State:** {input_data.medical_state}

### Segmentation Analysis
- **Segmentation Confidence:** {input_data.segmentation_confidence:.1f}%
- **Image Quality:** {"Excellent" if input_data.segmentation_confidence > 85 else "Good" if input_data.segmentation_confidence > 70 else "Adequate"}

---

## TREATMENT ANALYSIS

### Recommended Medicine
- **Medicine:** {input_data.medicine}
- **Therapeutic Indication:** Treatment of {input_data.cancer_type}
- **Predicted Effectiveness:** {input_data.medicine_effectiveness:.1%}

### Treatment Intelligence Score
- **Overall Treatment Score:** {input_data.treatment_score:.1f}/100
- **Medical Status:** {input_data.recovery_status}
- **Treatment Response:** {input_data.recovery_speed.replace("_", " ").title()}

### Effectiveness Analysis
{input_data.medicine_explanation}

---

## RECOVERY PREDICTION

### Timeline & Prognosis
{input_data.recovery_explanation}

### Recovery Status Breakdown
- **Status Code:** {input_data.recovery_status}
- **Predicted Trajectory:** {input_data.recovery_speed.replace("_", " ").title()}
- **Confidence Level:** {"Very High" if input_data.treatment_score >= 85 else "High" if input_data.treatment_score >= 70 else "Moderate" if input_data.treatment_score >= 55 else "Low"}

---

## TUMOR BEHAVIOR & EVOLUTION

### Aggressiveness Analysis
{input_data.aggressiveness_explanation}

### Predicted Evolution Pattern
{input_data.evolution_explanation}

### Biological Dynamics
The tumor demonstrates:
- **Growth Pattern:** {"Controlled and shrinking" if input_data.treatment_score >= 85 else "Stable under treatment" if input_data.treatment_score >= 70 else "Minimal response to treatment" if input_data.treatment_score >= 40 else "Aggressive progression"}
- **Treatment Response:** {"Excellent" if input_data.effectiveness > 0.75 else "Good" if input_data.effectiveness > 0.55 else "Moderate" if input_data.effectiveness > 0.35 else "Poor"}
- **Morphological Dynamics:** {"Fragmenting and necrotic" if input_data.treatment_score >= 85 else "Stabilized morphology" if input_data.treatment_score >= 70 else "Progressive deformation"}

---

## RISK STRATIFICATION

### Overall Risk Assessment
- **Risk Level:** {input_data.risk_level.upper()}
- **Risk Score:** {input_data.risk_score:.0f}/100
- **Clinical Significance:** {"Favorable prognosis with excellent control" if input_data.risk_score < 35 else "Guarded prognosis requiring close monitoring" if input_data.risk_score < 65 else "Aggressive disease requiring intensive management"}

### Component Risks
- **Recurrence Risk:** {input_data.recurrence_risk:.1%}
- **Progression Risk:** {input_data.progression_risk:.1%}
- **Treatment Resistance Probability:** {input_data.treatment_resistance_prob:.1%}

### Risk Interpretation
"""
        
        if input_data.risk_level == "low":
            md_report += "The tumor demonstrates excellent response to treatment with low risk of progression or recurrence. Current therapy should be continued with standard monitoring."
        elif input_data.risk_level == "intermediate":
            md_report += "The tumor shows partial response to treatment with intermediate risk factors. Close monitoring and treatment adherence are essential. Consider imaging follow-up in 4-6 weeks."
        else:
            md_report += "The tumor demonstrates aggressive biology with high risk of progression. Current treatment efficacy is limited. Immediate consideration of treatment modification is recommended."
        
        md_report += f"""

---

## CLINICAL RECOMMENDATIONS

### Primary Recommendation
{AIReportGenerator._generate_clinical_recommendation(input_data)}

### Monitoring Plan
- **Imaging Frequency:** {"Every 4 weeks" if input_data.risk_score > 65 else "Every 6-8 weeks" if input_data.risk_score > 35 else "Every 8-12 weeks"}
- **Clinical Assessment:** {"Monthly" if input_data.risk_score > 65 else "Every 6-8 weeks"}
- **Laboratory Monitoring:** Standard oncology markers as indicated

### Treatment Modification Triggers
- Tumor progression >10mm over 4 weeks
- Loss of treatment response (flattening of recovery curve)
- Development of new symptoms
- Adverse effects impacting quality of life

---

## SYSTEM INFORMATION

### AI Analysis Details
- **Analysis Platform:** TumorVerse Digital Tumor Twin
- **Model Version:** 2.0 (Integrated Intelligence Engine)
- **Analysis Confidence:** {"Very High" if input_data.segmentation_confidence > 85 else "High" if input_data.segmentation_confidence > 70 else "Moderate"}

### Report Interpretation
This report represents an AI-driven medical simulation analysis synthesizing:
- Tumor segmentation and morphological analysis
- Cancer type-specific biological models
- Personalized medicine response simulation
- Multi-factor risk stratification
- AI clinical decision support

This simulation is provided as a research and decision-support tool and does NOT constitute medical advice. All clinical decisions should be made by qualified oncologists in consultation with the patient.

---

## DISCLAIMER

This digital twin simulation is an AI model-based analysis tool designed to assist clinical decision-making. The system combines deep learning tumor analysis, treatment intelligence engines, and statistical risk modeling. 

**Important:** This report should be reviewed by qualified medical professionals. Clinical decisions should integrate this analysis with clinical examination, additional imaging, and multidisciplinary tumor board discussion.

**Generated:** {AIReportGenerator._get_current_timestamp()}
"""
        return md_report

    @staticmethod
    def _generate_json_report(input_data: ReportInput, report_id: str) -> Dict[str, Any]:
        """Generate JSON format report."""
        return {
            "report_id": report_id,
            "generated_timestamp": AIReportGenerator._get_current_timestamp(),
            "facility": input_data.facility_name,
            "tumor_characteristics": {
                "cancer_type": input_data.cancer_type,
                "tumor_size_mm": input_data.tumor_size,
                "aggressiveness": input_data.aggressiveness,
                "medical_state": input_data.medical_state,
                "segmentation_confidence_percent": input_data.segmentation_confidence,
            },
            "treatment_analysis": {
                "recommended_medicine": input_data.medicine,
                "medicine_effectiveness_percent": input_data.medicine_effectiveness * 100,
                "treatment_score": input_data.treatment_score,
                "recovery_status": input_data.recovery_status,
                "recovery_speed": input_data.recovery_speed,
            },
            "explanations": {
                "medicine_recommendation": input_data.medicine_explanation,
                "recovery_prediction": input_data.recovery_explanation,
                "aggressiveness_analysis": input_data.aggressiveness_explanation,
                "evolution_analysis": input_data.evolution_explanation,
            },
            "risk_assessment": {
                "overall_risk_level": input_data.risk_level,
                "risk_score_0_to_100": input_data.risk_score,
                "recurrence_risk_probability": input_data.recurrence_risk,
                "progression_risk_probability": input_data.progression_risk,
                "treatment_resistance_probability": input_data.treatment_resistance_prob,
            },
            "clinical_recommendation": AIReportGenerator._generate_clinical_recommendation(input_data),
            "system_info": {
                "platform": "TumorVerse Digital Tumor Twin",
                "model_version": "2.0",
                "analysis_confidence": "High",
            },
        }

    @staticmethod
    def _generate_html_report(markdown_report: str, report_id: str) -> str:
        """Generate HTML format report."""
        # Simple HTML conversion from markdown
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Report - {report_id}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }}
        .report {{
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #0066cc;
            border-bottom: 3px solid #0066cc;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #0088dd;
            margin-top: 30px;
            border-left: 4px solid #0088dd;
            padding-left: 10px;
        }}
        h3 {{
            color: #0099ee;
        }}
        .section {{
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }}
        ul {{
            line-height: 1.8;
        }}
        li {{
            margin-bottom: 8px;
        }}
        strong {{
            color: #0066cc;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #0066cc;
            font-size: 0.9em;
            color: #666;
            text-align: center;
        }}
        .warning {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .success {{
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .alert {{
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        code {{
            background-color: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }}
        th, td {{
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background-color: #f0f0f0;
            font-weight: bold;
        }}
        .report-id {{
            color: #666;
            font-size: 0.9em;
            margin-top: 10px;
        }}
    </style>
</head>
<body>
    <div class="report">
        <div id="content">
            {markdown_report.replace(chr(10), '<br>')}
        </div>
        <div class="footer">
            <div class="report-id">Report ID: {report_id}</div>
            <p>Generated by TumorVerse AI Medical Digital Twin Platform</p>
            <p><strong>Disclaimer:</strong> This report is an AI simulation and should be reviewed by qualified medical professionals.</p>
        </div>
    </div>
</body>
</html>"""
        return html

    @staticmethod
    def _generate_clinical_recommendation(input_data: ReportInput) -> str:
        """Generate clinical recommendation text."""
        if input_data.treatment_score >= 85:
            return f"Continue current {input_data.medicine} regimen with standard monitoring. Excellent tumor control achieved. Reassess in 8-12 weeks."
        elif input_data.treatment_score >= 70:
            return f"Continue current {input_data.medicine} therapy. Adequate disease control maintained. Schedule follow-up imaging in 6 weeks."
        elif input_data.treatment_score >= 55:
            return f"Maintain current therapy with close monitoring. Partial response to {input_data.medicine} observed. Consider intensification if response plateaus."
        elif input_data.treatment_score >= 40:
            return f"Current {input_data.medicine} therapy showing limited efficacy. Recommend consultation with tumor board for treatment modification options."
        else:
            return f"URGENT: {input_data.medicine} therapy demonstrating inadequate response. IMMEDIATE treatment change recommended. Multi-disciplinary review required."

    @staticmethod
    def _generate_pdf_report(html_report: str, report_id: str) -> bytes:
        """Generate PDF report from HTML using simple conversion.
        
        Falls back to HTML in base64 if weasyprint/reportlab not available.
        For production, install: pip install weasyprint
        """
        try:
            from weasyprint import HTML, CSS
            
            # Create PDF from HTML
            html_doc = HTML(string=html_report)
            pdf_bytes = html_doc.write_pdf()
            return pdf_bytes
        except ImportError:
            # Fallback: return base64 encoded HTML that can be displayed in browser
            html_bytes = html_report.encode('utf-8')
            return base64.b64encode(html_bytes)

    @staticmethod
    def generate_report(input_data: ReportInput) -> MedicalReport:
        """Generate complete medical report."""
        
        report_id = AIReportGenerator._generate_report_id()
        timestamp = AIReportGenerator._get_current_timestamp()
        
        # Generate all formats
        markdown_report = AIReportGenerator._generate_markdown_report(input_data)
        json_report = AIReportGenerator._generate_json_report(input_data, report_id)
        html_report = AIReportGenerator._generate_html_report(markdown_report, report_id)
        
        # Generate PDF (with fallback to HTML base64)
        pdf_bytes = AIReportGenerator._generate_pdf_report(html_report, report_id)
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        return MedicalReport(
            report_id=report_id,
            generated_timestamp=timestamp,
            markdown_report=markdown_report,
            json_report=json_report,
            html_report=html_report,
            pdf_report_base64=pdf_base64,
        )

    @staticmethod
    def report_to_dict(report: MedicalReport) -> Dict[str, Any]:
        """Convert report to dictionary for API response."""
        return {
            "report_id": report.report_id,
            "generated_timestamp": report.generated_timestamp,
            "markdown": report.markdown_report,
            "json": report.json_report,
            "html": report.html_report,
            "pdf_base64": report.pdf_report_base64,
        }


# Singleton instance
ai_report_generator = AIReportGenerator()
