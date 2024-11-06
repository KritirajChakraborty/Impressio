import React, { useState, useEffect } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [imageHistory, setImageHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dimensions, setDimensions] = useState({ width: "", height: "" });
  const [quality, setQuality] = useState("");
  const [dpi, setDpi] = useState("");
  const [format, setFormat] = useState("jpeg");
  const { token, logout } = useAuth();
  const apiURL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    fetchImageHistory();
  }, []);

  const fetchImageHistory = async () => {
    try {
      const response = await axios.get(`${apiURL}/api/images/history`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setImageHistory(response.data);
    } catch (error) {
      console.error("Error fetching image history:", error);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleFormatChange = (event) => {
    const selectedFormat = event.target.value;
    setFormat(selectedFormat);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("dimensions", JSON.stringify(dimensions));
    formData.append("quality", quality);
    formData.append("dpi", dpi);
    formData.append("format", format);

    try {
      const response = await axios.post(
        `${apiURL}/api/images/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProcessedImage(response.data);
      fetchImageHistory();
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (imageUrl) => {
    try {
      const response = await axios.get(imageUrl, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "image.jpg");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const handleDelete = async (imageId) => {
    try {
      await axios.delete(`${apiURL}/api/images/delete/${imageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Image deleted successfully");
      fetchImageHistory();
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const handleDeleteProcessedImage = () => {
    setProcessedImage(null);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 sm:px-3 px-4">
      <div className="px-3 py-6 sm:px-4">
        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <label
              htmlFor="file-input"
              className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Click to upload</span> or drag
                  and drop
                </div>
              </div>
              <input
                id="file-input"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>
      </div>
      <div className="mt-4 px-3 sm:px-4 py-6 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 items-center justify-evenly">
          <input
            type="number"
            placeholder="Width"
            value={dimensions.width}
            onChange={(e) =>
              setDimensions({ ...dimensions, width: e.target.value })
            }
            className="border p-2 rounded-md"
          />
          <input
            type="number"
            placeholder="Height"
            value={dimensions.height}
            onChange={(e) =>
              setDimensions({ ...dimensions, height: e.target.value })
            }
            className="border p-2 rounded-md"
          />
          <input
            type="number"
            placeholder="Quality"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="border p-2 rounded-md"
          />
          <input
            type="number"
            placeholder="DPI"
            value={dpi}
            onChange={(e) => setDpi(e.target.value)}
            className="border p-2 rounded-md"
          />
        </div>

        <div className="mt-4">
          <h3 className="block text-sm font-medium text-gray-700">
            Select Formats:
          </h3>
          <div className="flex gap-4">
            <label>
              <input
                type="radio"
                name="format"
                value="jpeg"
                checked={format === "jpeg"}
                onChange={handleFormatChange}
                className="mr-2"
              />
              JPEG
            </label>
            <label>
              <input
                type="radio"
                name="format"
                value="png"
                checked={format === "png"}
                onChange={handleFormatChange}
                className="mr-2"
              />
              PNG
            </label>
            <label>
              <input
                type="radio"
                name="format"
                value="webp"
                checked={format === "webp"}
                onChange={handleFormatChange}
                className="mr-2"
              />
              WebP
            </label>
            <label>
              <input
                type="radio"
                name="format"
                value="jpg"
                checked={format === "jpg"}
                onChange={handleFormatChange}
                className="mr-2"
              />
              JPG
            </label>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={handleUpload}
          disabled={loading}
          className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {processedImage && (
        <div className="mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Processed Image
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(processedImage.compressed)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Download
              </button>
              <button
                onClick={() => handleDeleteProcessedImage()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
          <div className="mt-2 flex justify-center">
            <img
              src={processedImage.compressed}
              alt="Processed"
              className="max-h-96 object-contain"
              loading="lazy"
            />
          </div>
        </div>
      )}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Image History
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imageHistory &&
            imageHistory.map((image) => (
              <div
                key={image._id}
                className="bg-white shadow-md rounded-lg overflow-hidden"
              >
                <img
                  src={image.compressedUrl}
                  alt="Compressed"
                  className="w-full h-40 object-cover"
                  loading="lazy"
                />
                <div className="p-4">
                  <p className="font-medium text-gray-900">
                    Compressed: {image.compressedSize} bytes
                  </p>
                  <p className="text-gray-500 text-sm">
                    Original: {image.originalSize} bytes
                  </p>
                  <div className="flex flex-row justify-between">
                    <button
                      onClick={() => handleDownload(image.compressedUrl)}
                      className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(image._id)}
                      className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
