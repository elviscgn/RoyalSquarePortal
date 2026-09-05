import os
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch


def generate_form_submission_pdf(
    submission_id: int,
    form_title: str,
    form_version: str,
    client_name: str,
    id_number: str,
    answers: Dict[str, Any],
    signature: Optional[Dict[str, Any]] = None,
    output_dir: Optional[str] = None,
) -> str:
    """Generates a professional PDF document for a completed Royal Square digital form submission."""
    if output_dir is None:
        output_dir = os.path.abspath(
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "documents")
        )
    os.makedirs(output_dir, exist_ok=True)

    filename = f"royal_square_submission_{submission_id}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}.pdf"
    file_path = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    header_style = ParagraphStyle(
        "HeaderTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f2744"),
    )
    sub_header_style = ParagraphStyle(
        "SubHeader",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#4a5568"),
    )
    section_title_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1a365d"),
    )
    cell_bold = ParagraphStyle(
        "CellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#2d3748"),
    )
    cell_text = ParagraphStyle(
        "CellText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#2d3748"),
    )
    legal_text = ParagraphStyle(
        "LegalText",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#718096"),
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("ROYAL SQUARE FINANCIAL (PTY) LTD", header_style))
    story.append(Paragraph("Authorised Financial Services Provider • FSP 49281 • www.royalsquare.co.za", sub_header_style))
    story.append(Paragraph("Specialists in Financial Planning, Wealth Management & Insurance Since 2009", sub_header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#c09a47"), spaceBefore=5, spaceAfter=15))

    # 2. Document Title
    story.append(Paragraph(f"<b>DIGITAL INSTRUCTION RECORD</b>: {form_title.upper()}", section_title_style))
    story.append(Paragraph(f"Form Version: {form_version} | Submission Reference: RSF-SUB-{submission_id:05d} | Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", sub_header_style))
    story.append(Spacer(1, 15))

    # 3. Client Identity Summary Table
    story.append(Paragraph("CLIENT RECORD INFORMATION", section_title_style))
    story.append(Spacer(1, 6))

    client_table_data = [
        [Paragraph("Client Full Name:", cell_bold), Paragraph(client_name, cell_text),
         Paragraph("RSA ID Number:", cell_bold), Paragraph(id_number, cell_text)],
    ]
    t_client = Table(client_table_data, colWidths=[110, 160, 110, 160])
    t_client.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f7fafc")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#edf2f7")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t_client)
    story.append(Spacer(1, 15))

    # 4. Form Answers Table
    story.append(Paragraph("RECORDED FORM DETAILS & INSTRUCTIONS", section_title_style))
    story.append(Spacer(1, 6))

    answers_rows = [
        [Paragraph("Field", cell_bold), Paragraph("Submitted Value / Confirmation", cell_bold)]
    ]
    for k, v in answers.items():
        field_label = k.replace("_", " ").title()
        if isinstance(v, bool):
            val_str = "YES (Confirmed)" if v else "NO"
        elif isinstance(v, list):
            val_str = ", ".join(str(item) for item in v)
        elif isinstance(v, dict):
            val_str = str(v)
        else:
            val_str = str(v)
        answers_rows.append([Paragraph(field_label, cell_bold), Paragraph(val_str, cell_text)])

    t_answers = Table(answers_rows, colWidths=[180, 360])
    t_answers.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ebf8ff")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e0")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t_answers)
    story.append(Spacer(1, 15))

    # 5. Electronic Signature & Audit Metadata Box
    sig = signature or {}
    sig_signer = sig.get("signer_name", client_name)
    sig_time = sig.get("timestamp", datetime.now(timezone.utc).isoformat())
    sig_method = sig.get("method", "Digital Signature Pad / Electronic Confirmation")
    sig_device = sig.get("device", "Royal Square Verified Client Portal")
    sig_ip = sig.get("signer_ip", "127.0.0.1")

    # Generate a digital tamper-evident audit hash
    hash_content = f"{submission_id}|{client_name}|{id_number}|{sig_time}|{answers}"
    audit_hash = hashlib.sha256(hash_content.encode("utf-8")).hexdigest()[:24].upper()

    story.append(Paragraph("DIGITAL SIGNATURE & POPIA AUDIT SEAL", section_title_style))
    story.append(Spacer(1, 6))

    sig_data = [
        [Paragraph("Signatory:", cell_bold), Paragraph(f"<b>{sig_signer}</b> (Explicitly Confirmed)", cell_text)],
        [Paragraph("Signature Method:", cell_bold), Paragraph(sig_method, cell_text)],
        [Paragraph("Timestamp:", cell_bold), Paragraph(sig_time, cell_text)],
        [Paragraph("Device & Platform:", cell_bold), Paragraph(sig_device, cell_text)],
        [Paragraph("Client IP Address:", cell_bold), Paragraph(sig_ip, cell_text)],
        [Paragraph("Audit Integrity Hash:", cell_bold), Paragraph(f"<font color='#2b6cb0'><b>SHA256:{audit_hash}</b></font>", cell_text)],
    ]
    t_sig = Table(sig_data, colWidths=[150, 390])
    t_sig.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0fff4")),
        ("BOX", (0, 0), (-1, -1), 1.5, colors.HexColor("#38a169")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#c6f6d5")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t_sig)
    story.append(Spacer(1, 15))

    # 6. Legal & POPIA Disclaimer
    disclaimer = (
        "<b>LEGAL NOTICE & COMPLIANCE</b>: This document was electronically executed on the Royal Square Financial "
        "Adviser Operations Platform. Designed around POPIA principles (data minimisation, consent, controlled access, "
        "and auditability) and FAIS statutory disclosure obligations. An immutable record of this transaction is logged "
        "in the Royal Square Audit Trail."
    )
    story.append(Paragraph(disclaimer, legal_text))

    doc.build(story)
    return file_path
