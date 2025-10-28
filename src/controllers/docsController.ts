import { Request, Response, NextFunction } from 'express';
import { addDocument } from '../services/vectorService';
import fs from 'fs';
import pdfParse from 'pdf-parse';

export const docsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Subir Documentos</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 50px auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #333;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .upload-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .file-input-wrapper {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                }
                .file-input {
                    width: 100%;
                    padding: 12px;
                    border: 2px dashed #ddd;
                    border-radius: 5px;
                    background-color: #fafafa;
                    cursor: pointer;
                    transition: border-color 0.3s;
                }
                .file-input:hover {
                    border-color: #007bff;
                }
                .upload-btn {
                    background-color: #007bff;
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: background-color 0.3s;
                }
                .upload-btn:hover {
                    background-color: #0056b3;
                }
                .upload-btn:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }
                .status {
                    padding: 10px;
                    border-radius: 5px;
                    margin-top: 10px;
                    display: none;
                }
                .status.success {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .status.error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                .file-info {
                    margin-top: 10px;
                    font-size: 14px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📄 Subir Documentos PDF</h1>
                <form class="upload-form" id="uploadForm" enctype="multipart/form-data">
                    <div class="file-input-wrapper">
                        <input type="file" id="fileInput" name="file" accept=".pdf" class="file-input" required>
                    </div>
                    <div class="file-info" id="fileInfo"></div>
                    <button type="submit" class="upload-btn" id="uploadBtn">📤 Subir Documento</button>
                </form>
                <div class="status" id="status"></div>
            </div>

            <script>
                const form = document.getElementById('uploadForm');
                const fileInput = document.getElementById('fileInput');
                const fileInfo = document.getElementById('fileInfo');
                const uploadBtn = document.getElementById('uploadBtn');
                const status = document.getElementById('status');

                fileInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        fileInfo.textContent = \`Archivo seleccionado: \${file.name} (\${(file.size / 1024 / 1024).toFixed(2)} MB)\`;
                    } else {
                        fileInfo.textContent = '';
                    }
                });

                form.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const file = fileInput.files[0];
                    if (!file) {
                        showStatus('Por favor selecciona un archivo PDF', 'error');
                        return;
                    }

                    const formData = new FormData();
                    formData.append('file', file);

                    uploadBtn.disabled = true;
                    uploadBtn.textContent = '⏳ Subiendo...';

                    try {
                        const response = await fetch('/api/document/file', {
                            method: 'POST',
                            body: formData
                        });

                        const result = await response.json();

                        if (response.ok) {
                            showStatus(result.message, 'success');
                            form.reset();
                            fileInfo.textContent = '';
                        } else {
                            showStatus(result.message || 'Error al subir el archivo', 'error');
                        }
                    } catch (error) {
                        showStatus('Error de conexión al subir el archivo', 'error');
                    } finally {
                        uploadBtn.disabled = false;
                        uploadBtn.textContent = '📤 Subir Documento';
                    }
                });

                function showStatus(message, type) {
                    status.textContent = message;
                    status.className = \`status \${type}\`;
                    status.style.display = 'block';
                    
                    setTimeout(() => {
                        status.style.display = 'none';
                    }, 5000);
                }
            </script>
        </body>
        </html>
        `;

        res.send(html);
    } catch (error) {
        next(error);
    }
};

export const uploadDocumentFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: "No se recibió ningún archivo." });
      return;
    }

    const fileBuffer = fs.readFileSync(file.path);
    const pdfData = await pdfParse(fileBuffer);

    const text = pdfData.text.trim();

    if (!text) {
      res.status(400).json({ message: "No se pudo extraer texto del PDF." });
      return;
    }

    const docId = file.originalname;

    await addDocument(docId, text);

    // Eliminar el archivo temporal
    fs.unlinkSync(file.path);

    res.status(200).json({ message: `Documento ${docId} procesado y agregado correctamente.` });
  } catch (error) {
    console.error("Error procesando documento:", error);
    next(error);
  }
};