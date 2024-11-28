import { useState } from "react";
import imageCompression from "browser-image-compression"; // Importa la librería
import { ENV } from "../config";

const UploadAlbumImages = () => {
  const [albumName, setAlbumName] = useState(""); // Nombre del álbum
  const [folderName, setFolderName] = useState(""); // Nombre de la carpeta
  const [selectedFiles, setSelectedFiles] = useState([]); // Imágenes seleccionadas
  const [images, setImages] = useState([]); // Imágenes subidas
  const [thumbnail, setThumbnail] = useState(null); // Miniatura seleccionada
  const [albumDescription, setAlbumDescription] = useState(""); // Descripción del álbum

  const cloudName = ENV.CLOUD_NAME;
  const uploadPreset = ENV.UPLOAD_PRESET;

  // Funciones para actualizar los estados
  const handleAlbumNameChange = (e) => setAlbumName(e.target.value);
  const handleFolderNameChange = (e) => setFolderName(e.target.value);
  const handleAlbumDescriptionChange = (e) => setAlbumDescription(e.target.value);

  const handleFileSelection = async (e) => {
    const files = Array.from(e.target.files);

    try {
      // Comprimir las imágenes antes de subirlas
      const compressedFiles = await Promise.all(
        files.map((file) =>
          imageCompression(file, {
            maxSizeMB: 10, // Tamaño máximo en MB
            maxWidthOrHeight: 1920, // Ancho o alto máximo
            useWebWorker: true, // Mejor rendimiento
          })
        )
      );

      setSelectedFiles(compressedFiles); // Guardamos las imágenes comprimidas
    } catch (error) {
      console.error("Error durante la compresión de imágenes:", error);
      alert("Hubo un problema al comprimir las imágenes.");
    }
  };

  const uploadImagesToCloudinary = async () => {
    const uploadedImages = await Promise.all(
      selectedFiles.map((file) => uploadImage(file, folderName))
    );
    setImages((prevImages) => [...prevImages, ...uploadedImages]); // Guardar las imágenes subidas
    setSelectedFiles([]); // Limpiar la selección de archivos después de la carga
  };

  const uploadImage = (file, folder) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      if (folder) {
        formData.append("folder", folder);
      }

      fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          resolve({
            id: data.public_id,
            url: data.secure_url,
            name: file.name,
            width: data.width,
            height: data.height,
          });
        })
        .catch((error) => {
          console.error("Error uploading to Cloudinary:", error);
          reject(error);
        });
    });
  };

  const handleSetThumbnail = (image) => setThumbnail(image.id); // Establecer miniatura

  const handleClearImages = () => {
    setImages([]);
    setThumbnail(null);
    setSelectedFiles([]);
  };

  const handleDeleteImage = (imageId) => {
    setImages((prevImages) => prevImages.filter((image) => image.id !== imageId));
    if (thumbnail === imageId) setThumbnail(null);
  };

  const handleSaveAlbum = () => {
    console.log({albumName, thumbnail,albumDescription})
    if (!albumName || !thumbnail || !albumDescription) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    const albumData = {
      name: albumName,
      description: albumDescription,
      thumbnail: thumbnail, // ID de la miniatura seleccionada
      images: images, // Todas las imágenes subidas
    };

    // Aquí puedes enviar albumData a tu servidor o base de datos para guardar
    console.log("Album Data:", albumData);
    alert("Álbum guardado con éxito!");
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upload Album Images</h2>

      {/* Nombre del álbum */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Album Name</label>
        <input
          type="text"
          placeholder="Enter album name"
          value={albumName} // Valor del estado
          onChange={handleAlbumNameChange} // Actualización del estado
          className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
        />
      </div>

      {/* Descripción del álbum */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Album Description</label>
        <textarea
          placeholder="Enter album description"
          value={albumDescription} // Valor del estado
          onChange={handleAlbumDescriptionChange} // Actualización del estado
          className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
        />
      </div>

      {/* Nombre de la carpeta */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Folder Name</label>
        <input
          type="text"
          placeholder="Enter folder name"
          value={folderName} // Valor del estado
          onChange={handleFolderNameChange} // Actualización del estado
          className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
        />
      </div>

      {/* Selección de imágenes */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Images</label>
        <div className="flex items-center justify-center p-4 border border-gray-300 rounded-lg mb-4">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelection} // Actualización de las imágenes seleccionadas
            className="hidden"
            id="imageUpload"
          />
          <label htmlFor="imageUpload" className="cursor-pointer text-center">
            <div className="flex flex-col items-center">
              <span className="text-2xl">📷</span>
              <span className="mt-2 text-sm text-gray-600">Add Images</span>
            </div>
          </label>
        </div>
      </div>

      {/* Visualización de imágenes subidas */}
      <div className="grid grid-cols-3 gap-4">
        {images.map((image) => (
          <div key={image.id} className="relative group">
            <img
              src={image.url}
              alt={image.name}
              className={`object-cover w-full h-24 rounded-md cursor-pointer ${
                thumbnail === image.id ? "border-4 border-blue-500" : "border"
              }`}
              onClick={() => handleSetThumbnail(image)} // Establecer miniatura al hacer clic
            />
            <button
              onClick={() => handleDeleteImage(image.id)}
              className="absolute top-0 right-0 mt-1 mr-1 p-1 bg-red-500 text-white text-xs rounded-full opacity-75 hover:opacity-100"
            >
              ✕
            </button>
            <p className="text-xs mt-1 text-center truncate">{image.name}</p>
            <p className="text-xs text-center">
              {image.width} x {image.height}
            </p>
          </div>
        ))}
      </div>

      {/* Botones de acción */}
      <div className="flex justify-between mt-4">
        <button
          onClick={handleClearImages}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
        >
          Clear
        </button>
        <button
          onClick={uploadImagesToCloudinary}
          className="px-4 py-2 bg-black text-white rounded-md"
        >
          Upload Album
        </button>
      </div>

      {/* Botón para guardar el álbum */}
      <div className="flex justify-between mt-4">
        <button
          onClick={handleSaveAlbum} // Guardar los datos del álbum
          className="px-4 py-2 bg-green-500 text-white rounded-md"
        >
          Save Album
        </button>
      </div>
    </div>
  );
};

export default UploadAlbumImages;