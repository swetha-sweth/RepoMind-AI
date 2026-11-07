
import { useState } from "react";
import "./ReadmeGenerator.css";

function ReadmeGenerator() {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [features, setFeatures] = useState("");
  const [installation, setInstallation] = useState(
    "git clone <repository-url>\nnpm install\nnpm run dev"
  );
  const [usage, setUsage] = useState("Start the application and open it in your browser.");
  const [githubUrl, setGithubUrl] = useState("");
  const [license, setLicense] = useState("MIT");
  const [readme, setReadme] = useState("");

  const generateReadme = () => {
    if (!projectName.trim() || !description.trim()) {
      alert("Please enter project name and description.");
      return;
    }

    const technologyList = technologies
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const featureList = features
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const output = `# ${projectName}

${githubUrl ? `[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](${githubUrl})` : ""}

## 📌 Project Overview

${description}

## 🛠️ Technologies Used

${technologyList.length
        ? technologyList.map((tech) => `- ${tech}`).join("\n")
        : "- Add your technologies here"}

## ✨ Features

${featureList.length
        ? featureList.map((feature) => `- ${feature}`).join("\n")
        : "- Add your project features here"}

## ⚙️ Installation

\`\`\`bash
${installation}
\`\`\`

## 🚀 Usage

${usage}

## 📂 Project Structure

Add your project folder structure here.

## 🤝 Contributing

Contributions are welcome! Feel free to fork this repository and submit a pull request.

## 📄 License

This project is licensed under the ${license} License.

---

⭐ If you find this project useful, consider giving it a star!
`;

    setReadme(output);
  };

  const copyReadme = async () => {
    try {
      await navigator.clipboard.writeText(readme);
      alert("README copied successfully!");
    } catch (error) {
      alert("Unable to copy README. Please copy it manually.");
    }
  };

  const downloadReadme = () => {
    const blob = new Blob([readme], {
      type: "text/markdown;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "README.md";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="readme-page">
      <span className="tag">✦ SMART DOCUMENTATION TOOL</span>

      <h1>README Generator</h1>

      <p className="readme-subtitle">
        Generate professional GitHub documentation for your projects.
      </p>

      <div className="readme-layout">
        <div className="readme-card">
          <h3>Project Details</h3>

          <label>Project Name *</label>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. AI GitHub Repository Analyzer"
          />

          <label>Project Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what your project does..."
            rows="4"
          />

          <label>GitHub Repository URL</label>
          <input
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
          />

          <label>Technologies Used</label>
          <input
            value={technologies}
            onChange={(e) => setTechnologies(e.target.value)}
            placeholder="React, Node.js, MongoDB, Express"
          />

          <label>Project Features (one per line)</label>
          <textarea
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            placeholder={"GitHub repository analysis\nAI-powered code review\nREADME generation"}
            rows="4"
          />

          <label>Installation Commands</label>
          <textarea
            value={installation}
            onChange={(e) => setInstallation(e.target.value)}
            rows="4"
          />

          <label>Usage Instructions</label>
          <textarea
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
            rows="3"
          />

          <label>License</label>
          <select
            value={license}
            onChange={(e) => setLicense(e.target.value)}
          >
            <option value="MIT">MIT</option>
            <option value="Apache 2.0">Apache 2.0</option>
            <option value="GPL 3.0">GPL 3.0</option>
            <option value="BSD 3-Clause">BSD 3-Clause</option>
            <option value="Unspecified">Unspecified</option>
          </select>

          <button className="generate-btn" onClick={generateReadme}>
            ✨ Generate README
          </button>
        </div>

        <div className="readme-card preview-card">
          <h3>README Preview</h3>

          {readme ? (
            <pre>{readme}</pre>
          ) : (
            <div className="empty-preview">
              <span>📄</span>
              <p>Your README will appear here.</p>
            </div>
          )}

          {readme && (
            <div className="readme-actions">
              <button className="generate-btn" onClick={copyReadme}>
                📋 Copy README
              </button>

              <button className="generate-btn" onClick={downloadReadme}>
                ⬇ Download README.md
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReadmeGenerator;
