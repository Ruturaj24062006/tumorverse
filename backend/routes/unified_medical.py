"""Unified medical pipeline API route for TumorVerse.

Exposes the complete integrated AI medical analysis pipeline.
Single endpoint that orchestrates all modules.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from fastapi.responses import StreamingResponse
import base64
from io import BytesIO

from utils.unified_medical_pipeline import (
    unified_medical_pipeline,
    UnifiedMedicalInput,
)


router = APIRouter()


class UnifiedMedicalRequest(BaseModel):
    """Request model for unified medical analysis."""
    patient_id: str = Field(..., description="Unique patient identifier")
    
    # Tumor characteristics
    cancer_type: str = Field(..., description="Primary cancer type (e.g., GBM, LUAD, BRCA)")
    tumor_size: float = Field(..., ge=0.1, le=200, description="Tumor size in mm")
    aggressiveness: str = Field(
        ...,
        description="Tumor aggressiveness level",
        pattern="^(low|moderate|high)$"
    )
    
    # Segmentation data
    segmentation_confidence: float = Field(
        ...,
        ge=0,
        le=100,
        description="Segmentation quality confidence (0-100%)"
    )
    tumor_geometry_hash: str = Field(
        ...,
        description="Hash of tumor segmentation for reproducibility"
    )
    
    # Treatment
    medicine: str = Field(..., description="Recommended medicine name")
    medicine_effectiveness: float = Field(
        ...,
        ge=0,
        le=1,
        description="Predicted medicine effectiveness (0-1)"
    )
    
    # Clinical context
    response_trend: float = Field(
        default=50,
        ge=0,
        le=100,
        description="Tumor response trend (0-100)"
    )
    previous_tumor_size: Optional[float] = Field(
        default=None,
        ge=0.1,
        le=200,
        description="Previous tumor size for trend comparison (mm)"
    )
    previous_aggressiveness: Optional[float] = Field(
        default=None,
        ge=0,
        le=100,
        description="Previous aggressiveness value (0-100)"
    )


class UnifiedMedicalResponse(BaseModel):
    """Response model for unified medical analysis."""
    patient_id: str
    core_metrics: Dict[str, Any]
    tumor_behavior: Dict[str, Any]
    risk_profile: Dict[str, Any]
    explanations: Dict[str, str]
    visual_guidance: Dict[str, Any]
    report: Dict[str, Any]
    success: bool = True
    message: str = "Medical analysis completed successfully"


@router.post(
    "/unified-medical-analysis",
    response_model=UnifiedMedicalResponse,
    summary="Complete Unified Medical Analysis",
    tags=["Medical Analysis"],
)
async def unified_medical_analysis(request: UnifiedMedicalRequest) -> UnifiedMedicalResponse:
    """
    Execute complete unified AI medical analysis pipeline.
    
    Orchestrates:
    - Treatment Intelligence Engine
    - Recovery Timeline Engine
    - Patient-Specific Tumor Behavior Engine
    - Tumor State System
    - Advanced Risk Analysis Engine
    - Explainable AI Engine
    - AI Report Generator
    
    Returns comprehensive integrated analysis.
    
    ## Key Metrics:
    - **treatment_score** (0-100): Overall treatment quality
    - **medical_state**: Current tumor state (Responding, Stable, Aggressive, etc.)
    - **effectiveness** (0-1): Predicted medicine effectiveness
    - **recovery_status**: Recovery prognosis
    
    ## Outputs:
    - Tumor behavior profile
    - Risk assessment
    - AI explanations for all decisions
    - Visual guidance for rendering
    - Complete medical report
    """
    
    try:
        # Create input
        analysis_input = UnifiedMedicalInput(
            patient_id=request.patient_id,
            cancer_type=request.cancer_type,
            tumor_size=request.tumor_size,
            aggressiveness=request.aggressiveness,
            segmentation_confidence=request.segmentation_confidence,
            tumor_geometry_hash=request.tumor_geometry_hash,
            medicine=request.medicine,
            medicine_effectiveness=request.medicine_effectiveness,
            response_trend=request.response_trend,
            previous_tumor_size=request.previous_tumor_size,
            previous_aggressiveness=request.previous_aggressiveness,
        )
        
        # Execute pipeline
        result = unified_medical_pipeline.analyze(analysis_input)
        
        # Convert to response
        result_dict = result.to_dict()
        
        return UnifiedMedicalResponse(
            **result_dict,
            success=True,
            message="Medical analysis completed successfully"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Medical analysis failed: {str(e)}"
        )


@router.get(
    "/unified-medical-analysis/info",
    summary="Unified Pipeline Information",
    tags=["Medical Analysis"],
)
async def pipeline_info() -> Dict[str, Any]:
    """
    Get information about the unified medical analysis pipeline.
    
    Returns:
    - Supported cancer types
    - Component modules
    - Output fields
    - System version
    """
    
    return {
        "system": "TumorVerse Unified Medical Digital Twin Pipeline",
        "version": "2.0",
        "description": "Complete AI medical analysis integrating all modules",
        "components": [
            "Treatment Intelligence Engine",
            "Recovery Timeline Engine",
            "Patient-Specific Tumor Behavior Engine",
            "Tumor State System",
            "Advanced Risk Analysis Engine",
            "Explainable AI Engine",
            "AI Report Generator",
        ],
        "supported_cancer_types": [
            "GBM", "GLIOMA", "LUAD", "LUNG", "BRCA", "BREAST",
            "COREAD", "COLORECTAL", "KIRC", "KIDNEY", "PITUITARY",
            "SKIN", "MELANOMA"
        ],
        "key_outputs": [
            "treatment_score",
            "medical_state",
            "recovery_status",
            "effectiveness",
            "tumor_behavior",
            "risk_profile",
            "explanations",
            "visual_guidance",
            "medical_report",
        ],
        "output_formats": [
            "JSON (structured data)",
            "Markdown (readable report)",
            "HTML (web display)",
        ],
    }


class ReportDownloadRequest(BaseModel):
    """Request to download a report in specific format."""
    report_id: str = Field(..., description="Report ID to download")
    format: str = Field(
        default="pdf",
        description="Format: 'pdf', 'html', 'markdown', or 'json'"
    )


@router.post(
    "/download-report",
    summary="Download Medical Report",
    tags=["Reports"],
)
async def download_report(request: ReportDownloadRequest):
    """
    Download a previously generated medical report in various formats.
    
    Formats:
    - **pdf**: PDF file (binary)
    - **html**: HTML file for web viewing
    - **markdown**: Markdown text file
    - **json**: Structured JSON data
    
    Note: Store report_id from unified-medical-analysis endpoint.
    """
    
    if request.format not in ["pdf", "html", "markdown", "json"]:
        raise HTTPException(
            status_code=400,
            detail="Format must be 'pdf', 'html', 'markdown', or 'json'"
        )
    
    # This would normally fetch from a database or cache
    # For now, return a placeholder response
    
    if request.format == "pdf":
        return StreamingResponse(
            iter([b"PDF content placeholder"]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={request.report_id}.pdf"
            }
        )
    elif request.format == "html":
        return StreamingResponse(
            iter([b"<html><body>Report HTML</body></html>"]),
            media_type="text/html",
            headers={
                "Content-Disposition": f"attachment; filename={request.report_id}.html"
            }
        )
    elif request.format == "markdown":
        return StreamingResponse(
            iter([b"# Medical Report"]),
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename={request.report_id}.md"
            }
        )
    else:  # json
        return {
            "report_id": request.report_id,
            "format": "json",
            "message": "JSON report data"
        }
