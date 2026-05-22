"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Download,
  FileText,
  Share2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Pill,
  Brain,
} from "lucide-react"

interface ReportData {
  cancer_type: string
  tumor_size: number
  aggressiveness: string
  medicine: string
  treatment_score: number
  effectiveness: number
  recovery_status: string
  recovery_timeline_days: number
  medicine_explanation: string
  recovery_explanation: string
  aggressiveness_explanation: string
  tumor_evolution_explanation: string
  risk_summary: string
  recurrence_risk: number
  progression_risk: number
  treatment_resistance_probability: number
  stabilization_confidence: number
  overall_risk_level: string
  clinical_summary: string
  generated_at: string
}

interface ClinicalReportGeneratorProps {
  data: ReportData
  facility_name?: string
  clinician_note?: string
}

const generateReportHTML = (data: ReportData, facilityName: string = "TumorVerse") => {
  const timestamp = new Date(data.generated_at).toLocaleString()
  const reportId = `TVDTWIN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Clinical Intelligence Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px;
    }
    
    .header {
      border-bottom: 3px solid #00E5FF;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .facility {
      font-size: 12px;
      color: #666;
      margin-bottom: 10px;
    }
    
    .title {
      font-size: 28px;
      font-weight: 600;
      color: #0A1628;
      margin-bottom: 10px;
    }
    
    .report-id {
      font-size: 11px;
      color: #999;
      margin-top: 5px;
    }
    
    .metadata {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .metadata-item {
      padding: 10px;
    }
    
    .metadata-label {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    
    .metadata-value {
      font-size: 16px;
      font-weight: 600;
      color: #0A1628;
    }
    
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #0A1628;
      border-left: 4px solid #00E5FF;
      padding-left: 15px;
      margin-bottom: 15px;
      margin-top: 20px;
    }
    
    .content {
      padding-left: 15px;
      line-height: 1.8;
      color: #333;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .metric-box {
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 3px solid #8A2BE2;
    }
    
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .metric-value {
      font-size: 24px;
      font-weight: 600;
      color: #00E5FF;
    }
    
    .risk-assessment {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .risk-item {
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      text-align: center;
    }
    
    .risk-item-label {
      font-size: 11px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .risk-item-value {
      font-size: 20px;
      font-weight: 600;
      color: #FF3B5C;
    }
    
    .risk-low { color: #00FF9C; }
    .risk-medium { color: #FF9F43; }
    .risk-high { color: #FF3B5C; }
    
    .explanation {
      padding: 15px;
      background: #f0f7ff;
      border-left: 4px solid #00E5FF;
      border-radius: 4px;
      margin-bottom: 15px;
      line-height: 1.7;
      color: #333;
    }
    
    .conclusion {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #8A2BE2;
      margin-top: 30px;
    }
    
    .footer {
      border-top: 1px solid #ddd;
      padding-top: 20px;
      margin-top: 40px;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    
    @media print {
      body {
        background: white;
      }
      .container {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="facility">AI-Powered Digital Tumor Twin Platform</div>
      <div class="title">AI Clinical Intelligence Report</div>
      <div class="report-id">Report ID: ${reportId} | Generated: ${timestamp}</div>
    </div>

    <!-- Metadata -->
    <div class="metadata">
      <div class="metadata-item">
        <div class="metadata-label">Cancer Type</div>
        <div class="metadata-value">${data.cancer_type}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Tumor Size</div>
        <div class="metadata-value">${data.tumor_size.toFixed(1)} mm</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Aggressiveness</div>
        <div class="metadata-value" style="text-transform: capitalize;">${data.aggressiveness}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Recommended Medicine</div>
        <div class="metadata-value">${data.medicine}</div>
      </div>
    </div>

    <!-- Medicine Recommendation -->
    <div class="section">
      <div class="section-title">Medicine Recommendation</div>
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-label">Treatment Score</div>
          <div class="metric-value">${data.treatment_score.toFixed(1)}/100</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Effectiveness</div>
          <div class="metric-value">${(data.effectiveness * 100).toFixed(1)}%</div>
        </div>
      </div>
      <div class="explanation">${data.medicine_explanation}</div>
    </div>

    <!-- Recovery Prediction -->
    <div class="section">
      <div class="section-title">Recovery Prediction</div>
      <div class="content">
        <div class="metrics-grid">
          <div class="metric-box">
            <div class="metric-label">Recovery Status</div>
            <div class="metric-value" style="font-size: 18px;">${data.recovery_status}</div>
          </div>
          <div class="metric-box">
            <div class="metric-label">Recovery Timeline</div>
            <div class="metric-value" style="font-size: 18px;">${data.recovery_timeline_days} days</div>
          </div>
        </div>
        <div class="explanation">${data.recovery_explanation}</div>
      </div>
    </div>

    <!-- Aggressiveness Analysis -->
    <div class="section">
      <div class="section-title">Tumor Aggressiveness Analysis</div>
      <div class="explanation">${data.aggressiveness_explanation}</div>
    </div>

    <!-- Tumor Evolution -->
    <div class="section">
      <div class="section-title">Projected Tumor Evolution</div>
      <div class="explanation">${data.tumor_evolution_explanation}</div>
    </div>

    <!-- Risk Assessment -->
    <div class="section">
      <div class="section-title">Comprehensive Risk Assessment</div>
      <div class="content">
        <div class="risk-assessment">
          <div class="risk-item">
            <div class="risk-item-label">Recurrence Risk</div>
            <div class="risk-item-value risk-${data.recurrence_risk > 0.7 ? 'high' : data.recurrence_risk > 0.4 ? 'medium' : 'low'}">
              ${(data.recurrence_risk * 100).toFixed(0)}%
            </div>
          </div>
          <div class="risk-item">
            <div class="risk-item-label">Progression Risk</div>
            <div class="risk-item-value risk-${data.progression_risk > 0.7 ? 'high' : data.progression_risk > 0.4 ? 'medium' : 'low'}">
              ${(data.progression_risk * 100).toFixed(0)}%
            </div>
          </div>
          <div class="risk-item">
            <div class="risk-item-label">Treatment Resistance</div>
            <div class="risk-item-value risk-${data.treatment_resistance_probability > 0.7 ? 'high' : data.treatment_resistance_probability > 0.4 ? 'medium' : 'low'}">
              ${(data.treatment_resistance_probability * 100).toFixed(0)}%
            </div>
          </div>
          <div class="risk-item">
            <div class="risk-item-label">Stabilization Confidence</div>
            <div class="risk-item-value risk-${data.stabilization_confidence > 0.7 ? 'low' : data.stabilization_confidence > 0.4 ? 'medium' : 'high'}">
              ${(data.stabilization_confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>
        <div class="explanation">${data.risk_summary}</div>
        <p style="margin-top: 15px; color: #666;">
          <strong>Overall Risk Level:</strong> <span style="text-transform: uppercase; font-weight: 600;">${data.overall_risk_level}</span>
        </p>
      </div>
    </div>

    <!-- Clinical Summary -->
    <div class="section">
      <div class="conclusion">
        <strong>Clinical Summary:</strong>
        <p style="margin-top: 10px;">${data.clinical_summary}</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This report represents an AI-powered analysis and simulation. It should be reviewed by qualified medical professionals before clinical decision-making.</p>
      <p style="margin-top: 10px;">TumorVerse AI Digital Tumor Twin Platform | © 2026</p>
    </div>
  </div>
</body>
</html>
  `
}

export function ClinicalReportGenerator({
  data,
  facility_name = "TumorVerse",
  clinician_note = "",
}: ClinicalReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleExportPDF = () => {
    setIsGenerating(true)
    const html = generateReportHTML(data, facility_name)
    const printWindow = window.open("", "", "width=1000,height=600")
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
        setIsGenerating(false)
      }, 250)
    }
  }

  const handleCopyReport = () => {
    const reportText = `
AI CLINICAL INTELLIGENCE REPORT
${data.cancer_type} - Digital Tumor Twin Analysis

PATIENT TUMOR DATA:
- Cancer Type: ${data.cancer_type}
- Tumor Size: ${data.tumor_size.toFixed(1)} mm
- Aggressiveness: ${data.aggressiveness}
- Treatment Score: ${data.treatment_score.toFixed(1)}/100

MEDICINE RECOMMENDATION:
- Medicine: ${data.medicine}
- Effectiveness: ${(data.effectiveness * 100).toFixed(1)}%
- Explanation: ${data.medicine_explanation}

RECOVERY PREDICTION:
- Status: ${data.recovery_status}
- Timeline: ${data.recovery_timeline_days} days
- Details: ${data.recovery_explanation}

RISK ASSESSMENT:
- Overall Risk Level: ${data.overall_risk_level}
- Recurrence Risk: ${(data.recurrence_risk * 100).toFixed(0)}%
- Progression Risk: ${(data.progression_risk * 100).toFixed(0)}%
- Treatment Resistance: ${(data.treatment_resistance_probability * 100).toFixed(0)}%
- Stabilization Confidence: ${(data.stabilization_confidence * 100).toFixed(0)}%

CLINICAL SUMMARY:
${data.clinical_summary}

Generated: ${new Date(data.generated_at).toLocaleString()}
    `
    navigator.clipboard.writeText(reportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/10">
          <FileText className="w-4 h-4 mr-2" />
          Clinical Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-[#0A1628] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">AI Clinical Intelligence Report</DialogTitle>
          <DialogDescription className="text-[#8899AA]">
            Download or share the generated clinical report
          </DialogDescription>
        </DialogHeader>

        {/* Report Preview */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
          {/* Header */}
          <div className="pb-4 border-b border-white/10">
            <p className="text-xs text-[#8899AA]">AI CLINICAL INTELLIGENCE REPORT</p>
            <h3 className="text-lg font-semibold text-[#E8EDF2] mt-2">{data.cancer_type}</h3>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white/5 rounded">
              <p className="text-xs text-[#8899AA]">Tumor Size</p>
              <p className="text-lg font-semibold text-[#00E5FF]">{data.tumor_size.toFixed(1)} mm</p>
            </div>
            <div className="p-3 bg-white/5 rounded">
              <p className="text-xs text-[#8899AA]">Treatment Score</p>
              <p className="text-lg font-semibold text-[#00E5FF]">{data.treatment_score.toFixed(1)}/100</p>
            </div>
            <div className="p-3 bg-white/5 rounded">
              <p className="text-xs text-[#8899AA]">Recommended Medicine</p>
              <p className="text-lg font-semibold text-[#8A2BE2]">{data.medicine}</p>
            </div>
            <div className="p-3 bg-white/5 rounded">
              <p className="text-xs text-[#8899AA]">Recovery Timeline</p>
              <p className="text-lg font-semibold text-[#8A2BE2]">{data.recovery_timeline_days} days</p>
            </div>
          </div>

          {/* Risk Levels */}
          <div className="p-4 bg-white/5 rounded">
            <p className="text-sm font-semibold text-[#E8EDF2] mb-3">Risk Assessment</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[#8899AA]">Recurrence:</span>
                <span className="ml-2 text-[#FF3B5C]">{(data.recurrence_risk * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-[#8899AA]">Progression:</span>
                <span className="ml-2 text-[#FF9F43]">{(data.progression_risk * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-[#8899AA]">Resistance:</span>
                <span className="ml-2 text-[#FF3B5C]">{(data.treatment_resistance_probability * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-[#8899AA]">Stabilization:</span>
                <span className="ml-2 text-[#00FF9C]">{(data.stabilization_confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-[#00E5FF]/5 rounded border border-[#00E5FF]/30">
            <p className="text-sm text-[#D1D7E0]">{data.clinical_summary}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-white/10">
          <Button
            onClick={handleExportPDF}
            disabled={isGenerating}
            className="flex-1 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#0A1628]"
          >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Download PDF"}
          </Button>
          <Button
            onClick={handleCopyReport}
            variant="outline"
            className="flex-1 border-white/10 text-[#8899AA] hover:text-[#E8EDF2]"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
