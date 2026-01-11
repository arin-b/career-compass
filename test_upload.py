import requests
import io
from pypdf import PdfWriter, PdfReader
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_dummy_pdf(filename="dummy_transcript.pdf"):
    c = canvas.Canvas(filename, pagesize=letter)
    c.drawString(100, 750, "Transcript for Alex H.")
    c.drawString(100, 730, "Course: Introduction to AI - Grade: A")
    c.drawString(100, 710, "Course: Data Structures - Grade: A-")
    c.drawString(100, 690, "Course: Operating Systems - Grade: B+")
    c.save()
    print(f"Created {filename}")

def test_upload():
    # 1. Create PDF
    pdf_path = "dummy_transcript.pdf"
    create_dummy_pdf(pdf_path)

    # 2. Upload
    url = "http://localhost:8000/api/v1/upload-transcript"
    user_id = "7dd566d5-5571-40f6-b913-e5e681ea0cb1"
    
    files = {'file': (pdf_path, open(pdf_path, 'rb'), 'application/pdf')}
    data = {'user_id': user_id}

    print(f"Uploading {pdf_path} for user {user_id}...")
    try:
        res = requests.post(url, files=files, data=data)
        res.raise_for_status()
        print("Upload Response:", res.json())
    except Exception as e:
        print("Upload Failed:", e)
        if 'res' in locals():
            print(res.text)

if __name__ == "__main__":
    test_upload()
