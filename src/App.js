import React, { useState, useEffect } from "react";
import "./App.css";

const exampleText = `\\documentclass{article}

\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}

\\begin{document}

Type your \\LaTeX\\ here. For example: $\\frac{1}{2}$

\\end{document}`;

// patch security issue associated with compiling latex
// change to inter font
// configure latex engine to disable shell escape commands (-no-shell-escape option with pdflatex).
// add ctrl + enter shortcut

function App() {
    const [inputText, setInputText] = useState(exampleText);
    const [compileText, setCompileText] = useState("Recompile (Ctrl + Enter)");
    const [PDFurl, setPDFurl] = useState("example.pdf");

    const handleInputChange = (event) => {
        setInputText(event.target.value);
    };

    const compilePDF = () => {
        setCompileText("Recompile (Ctrl + Enter)");

        fetch("https://willb256.pythonanywhere.com/get_pdf", {
            method: "POST",
            body: JSON.stringify(inputText),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.blob())
            .then((blob) => {
                if (PDFurl) {
                    window.URL.revokeObjectURL(PDFurl);
                }

                const url = window.URL.createObjectURL(blob);
                setPDFurl(url);
                console.log("Reached");
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    };

    // const uploadFile = () => {
    //     if (selectedFile) {
    //         const formData = new FormData();
    //         formData.append("file", selectedFile);

    //         fetch("API_ENDPOINT", {
    //             method: "POST",
    //             body: formData,
    //         })
    //             .then((response) => response.json())
    //             .then((data) => {
    //                 console.log("Success:", data);
    //             })
    //             .catch((error) => {
    //                 console.error("Error:", error);
    //             });
    //     }
    // };

    const handleCompile = (event) => {
        setCompileText("Compiling. Please wait.");
    };

    useEffect(() => {
        if (compileText === "Compiling. Please wait.") {
            compilePDF();
        }
    }, [compileText]);

    return (
        <div className="app-container">
            <div className="text-container">
                <div className="menu-bar">
                    <ul className="menu-list">
                        <li>Upload Image</li>
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
