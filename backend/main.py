import os
import io
from typing import List
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models
from databricks.sdk import WorkspaceClient
from dotenv import load_dotenv

# --- CONFIGURATION ---
load_dotenv()

DATABRICKS_HOST = os.getenv("DATABRICKS_HOST")
DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN")
SERVING_ENDPOINT_NAME = os.getenv("SERVING_ENDPOINT_NAME")
VOLUME_PATH = os.getenv("VOLUME_PATH")

if not all([DATABRICKS_HOST, DATABRICKS_TOKEN, SERVING_ENDPOINT_NAME, VOLUME_PATH]):
    raise ValueError("ERROR: Missing one or more required environment variables in .env file.")

w = WorkspaceClient(host=DATABRICKS_HOST,
                    azure_workspace_resource_id=os.getenv("DATABRICKS_WORKSPACE_RESOURCE_ID"),
                    azure_tenant_id=os.getenv("MICROSOFT_TENANT_ID"),
                    azure_client_id=os.getenv("MICROSOFT_CLIENT_ID"),
                    azure_client_secret=os.getenv("MICROSOFT_CLIENT_SECRET"))
# --- DATABASE TABLE CREATION ---
# This will now create tables in Azure Postgres
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS ---
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ENDPOINTS ---

@app.post("/upload")
async def upload_documents(files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    uploaded_files = []
    try:
        for file in files:
            destination_path = f"{VOLUME_PATH}/{file.filename}"
            file_content = await file.read()
            w.files.upload(destination_path, io.BytesIO(file_content), overwrite=True)
            
            new_doc = models.Document(filename=file.filename, filepath=destination_path)
            db.add(new_doc)
            db.commit()
            db.refresh(new_doc)
            uploaded_files.append({"id": new_doc.id, "filename": new_doc.filename})
        
        return {"status": "success", "uploaded": uploaded_files}
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
def get_documents(db: Session = Depends(get_db)):
    return db.query(models.Document).all()

@app.post("/chat")
def chat_direct_ai_foundry(
    doc_id: int = Form(...), 
    message: str = Form(...), 
    db: Session = Depends(get_db)
):
    document = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        system_prompt = "You are a helpful AI assistant for a legal team. Answer clearly and professionally."

        chat_response = w.serving_endpoints.query(
            name=SERVING_ENDPOINT_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.7,
            max_tokens=500
        )
        bot_response_text = chat_response.choices[0].message.content

        user_msg = models.ChatMessage(document_id=doc_id, role="user", content=message)
        db.add(user_msg)
        bot_msg = models.ChatMessage(document_id=doc_id, role="bot", content=bot_response_text)
        db.add(bot_msg)
        db.commit()

        return {"response": bot_response_text}
    except Exception as e:
        print(f"AI Foundry Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process with AI Foundry: {str(e)}")

@app.get("/history/{doc_id}")
def get_chat_history(doc_id: int, db: Session = Depends(get_db)):
    return db.query(models.ChatMessage).filter(models.ChatMessage.document_id == doc_id).all()