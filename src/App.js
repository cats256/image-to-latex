import React, { useState, useRef } from "react";
import "./App.css";

const exampleText = `\\documentclass{article}

\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}

\\begin{document}

\\LaTeX\\ code goes here. For example: $\\frac{1}{2}$

\\end{document}`;

function App() {
    const [inputText, setInputText] = useState(exampleText);
    const [compileText, setCompileText] = useState("Upload Image");
    const [PDFurl, setPDFurl] = useState("example.pdf");
    const fileInputRef = useRef(null);

    const handleInputChange = (event) => setInputText(event.target.value);
    const handleUploadClick = () => fileInputRef.current.click();

    const handleGenerate = async (event) => {
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
            const latexCode = data.latex_code;
            const base64PDF = data.pdf_file;

            const base64Response = await fetch(`data:application/pdf;base64,${base64PDF}`);
            const pdfBlob = await base64Response.blob();
            const url = URL.createObjectURL(pdfBlob);

            setPDFurl(url);
            setInputText(latexCode.trimStart());
        } catch (error) {
            console.error("Error:", error);
            setPDFurl(
                error.message.includes("422")
                    ? "unable_to_produce_latex.pdf"
                    : error.message.includes("500")
                    ? "compile-failed-document.pdf"
                    : "compile-failed-server.pdf"
            );
        }
        setCompileText("Upload Image");
    };

    const handleFileUpload = (event) => {
        setCompileText("Generating. Please wait.");
        handleGenerate(event);
    };

    const handleBase64Overleaf = () => {
        const encodedText = btoa(inputText);
        const overleafUrl = `https://www.overleaf.com/docs?snip_uri=data:application/x-tex;base64,${encodedText}`;
        window.open(overleafUrl, "_blank");
    };

    return (
        <div className="app-container">
            <div className="text-container">
                <div className="menu-bar">
                    <ul className="menu-list">
                        <li onClick={handleUploadClick}>{compileText}</li>
                        <input id="fileInput" type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                        <li>Insert Image URL</li>
                        <li>Download TeX File</li>
                        <li onClick={handleBase64Overleaf}>Open in Overleaf</li>
                    </ul>
                </div>
                <textarea value={inputText} onChange={handleInputChange} readOnly title="This field is read-only" />
            </div>
            <embed type="application/pdf" src={PDFurl} />
        </div>
    );
}

export default App;
