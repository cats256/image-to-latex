import React, { useState, useRef } from "react";
import "./App.css";

const exampleText = `\\documentclass{article}

\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}

\\begin{document}

Type your \\LaTeX\\ here. For example: $\\frac{1}{2}$

\\end{document}`;

function App() {
    const [inputText, setInputText] = useState(exampleText);
    const [compileText, setCompileText] = useState("Upload Image");
    const [PDFurl, setPDFurl] = useState("example.pdf");
    const fileInputRef = useRef(null);

    const handleInputChange = (event) => setInputText(event.target.value);
    const handleUploadClick = () => fileInputRef.current.click();

    const base64ToBlob = async (base64Data, contentType) => {
        const base64Response = await fetch(`data:${contentType};base64,${base64Data}`);
        return base64Response.blob();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("file", file);

            fetch("https://willb256.pythonanywhere.com/test_get_image", {
                method: "POST",
                body: formData,
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.json();
                })
                .then(async (data) => {
                    const latexCode = data.latex_code;
                    const base64PDF = data.pdf_file;

                    const pdfBlob = await base64ToBlob(base64PDF, "application/pdf");
                    const url = URL.createObjectURL(pdfBlob);

                    setPDFurl(url);
                    setInputText(latexCode.startsWith("\n") ? latexCode.substring(1) : latexCode);
                    setCompileText("Recompile (Ctrl + Enter)");
                })
                .catch((error) => {
                    if (error.message.includes("422")) {
                        setPDFurl("unable_to_produce_latex.pdf");
                    } else if (error.message.includes("500")) {
                        setPDFurl("compile-failed-document.pdf");
                    } else {
                        setPDFurl("compile-failed-server.pdf");
                    }
                    console.error("Error:", error);
                    setCompileText("Recompile (Ctrl + Enter)");
                });
        } else {
            setCompileText("Recompile (Ctrl + Enter)");
        }
    };

    const handleCompile = (event) => {
        setCompileText("Compiling. Please wait.");
        handleFileChange(event);
    };

    return (
        <div className="app-container">
            <div className="text-container">
                <div className="menu-bar">
                    <ul className="menu-list">
                        <li onClick={handleUploadClick}>{compileText}</li>
                        <input type="file" ref={fileInputRef} onChange={handleCompile} accept="image/*" />
                        <li>Insert Image URL</li>
                        <li>Download TeX File</li>
                    </ul>
                </div>
                <textarea
                    value={inputText === exampleText ? inputText : inputText}
                    onChange={handleInputChange}
                    placeholder={exampleText}
                />
            </div>
            <embed type="application/pdf" src={PDFurl} />
        </div>
    );
}

export default App;
