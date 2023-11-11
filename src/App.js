import React, { useState, useRef } from "react";
import "./App.css";

const defaultLatexTemplate = `\\documentclass{article}

\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}

\\begin{document}

\\LaTeX\\ code goes here. For example: $\\frac{1}{2}$

\\end{document}`;

function App() {
    const [latexCode, setLatexCode] = useState(defaultLatexTemplate);
    const [uploadButtonText, setUploadButtonText] = useState("Upload Image");
    const [pdfUrl, setPdfUrl] = useState("example.pdf");
    const uploadFileInputRef = useRef(null);

    const handleLatexCodeChange = (event) => setLatexCode(event.target.value);
    const triggerFileUpload = () => uploadFileInputRef.current.click();

    const processImageUpload = async (event) => {
        try {
            const file = event.target.files[0];
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("https://willb256.pythonanywhere.com/test_get_image", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const updatedLatexCode = data.latex_code;
            const base64PDF = data.pdf_file;

            const base64Response = await fetch(`data:application/pdf;base64,${base64PDF}`);
            const pdfBlob = await base64Response.blob();
            const url = URL.createObjectURL(pdfBlob);

            setPdfUrl(url);
            setLatexCode(updatedLatexCode.trimStart());
        } catch (error) {
            console.error("Error:", error);
            setPdfUrl(
                error.message.includes("422")
                    ? "unable_to_produce_latex.pdf"
                    : error.message.includes("500")
                    ? "compile-failed-document.pdf"
                    : "compile-failed-server.pdf"
            );
        }
        setUploadButtonText("Upload Image");
    };

    const onFileSelected = (event) => {
        setUploadButtonText("Generating. Please wait.");
        processImageUpload(event);
    };

    const openInOverleafWithBase64Encoding = () => {
        const encodedText = btoa(latexCode);
        const overleafUrl = `https://www.overleaf.com/docs?snip_uri=data:application/x-tex;base64,${encodedText}`;
        window.open(overleafUrl, "_blank");
    };

    return (
        <div className="app-container">
            <div className="text-container">
                <div className="menu-bar">
                    <ul className="menu-list">
                        <li onClick={triggerFileUpload}>{uploadButtonText}</li>
                        <input
                            id="fileInput"
                            type="file"
                            ref={uploadFileInputRef}
                            onChange={onFileSelected}
                            accept="image/*"
                        />
                        <li>Insert Image URL</li>
                        <li>Download TeX File</li>
                        <li onClick={openInOverleafWithBase64Encoding}>Open in Overleaf</li>
                    </ul>
                </div>
                <textarea value={latexCode} onChange={handleLatexCodeChange} readOnly title="This field is read-only" />
            </div>
            <embed type="application/pdf" src={pdfUrl} />
        </div>
    );
}

export default App;
