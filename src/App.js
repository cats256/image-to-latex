import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const exampleText = `\\documentclass{article}

\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}

\\begin{document}

Type your \\LaTeX\\ here. For example: $\\frac{1}{2}$

\\end{document}`;

function App() {
    const [inputText, setInputText] = useState(exampleText);
    const [compileText, setCompileText] = useState("Recompile (Ctrl + Enter)");
    const [PDFurl, setPDFurl] = useState("example.pdf");
    const fileInputRef = useRef(null);

    const handleInputChange = (event) => {
        setInputText(event.target.value);
    };

    const handleCompile = () => {
        setCompileText("Compiling. Please wait.");
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("file", file);

            fetch("http://127.0.0.1:5000/test_get_image", {
                method: "POST",
                body: formData,
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.blob();
                })
                .then((blob) => {
                    if (PDFurl) {
                        window.URL.revokeObjectURL(PDFurl);
                    }

                    const url = window.URL.createObjectURL(blob);
                    setPDFurl(url);
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
                });
        }
    };

    useEffect(() => {
        if (compileText === "Compiling. Please wait.") {
            setCompileText("Recompile (Ctrl + Enter)");

            fetch("https://willb256.pythonanywhere.com/get_pdf", {
                method: "POST",
                body: JSON.stringify(inputText),
                headers: {
                    "Content-Type": "application/json",
                },
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.blob();
                })
                .then((blob) => {
                    if (PDFurl) {
                        window.URL.revokeObjectURL(PDFurl);
                    }

                    const url = window.URL.createObjectURL(blob);
                    setPDFurl(url);
                })
                .catch((error) => {
                    if (error.message.includes("422")) {
                        setPDFurl("unable_to_product_latex.pdf");
                    } else if (error.message.includes("500")) {
                        setPDFurl("compile-failed-document.pdf");
                    } else {
                        setPDFurl("compile-failed-server.pdf");
                    }
                    console.error("Error:", error);
                });
        }
    }, [compileText, PDFurl, inputText]);

    return (
        <div className="app-container">
            <div className="text-container">
                <div className="menu-bar">
                    <ul className="menu-list">
                        <li onClick={handleUploadClick}>Upload Image</li>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                        <li>Insert Image URL</li>
                        <li>Download TeX File</li>
                        <li onClick={handleCompile}>{compileText}</li>
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
