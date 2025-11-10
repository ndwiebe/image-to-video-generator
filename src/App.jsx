import React, { useState, useEffect } from 'react';
import { Upload, Play, Download, AlertCircle, CheckCircle, Loader, Trash2 } from 'lucide-react';

export default function ImageToVideoGenerator() {
  const [apiToken, setApiToken] = useState('');
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, chaotic, deformed, watermark, bad anatomy, shaky camera view point');
  const [modelType, setModelType] = useState('I2V');
  const [videoLength, setVideoLength] = useState('81');
  const [endImageUrl, setEndImageUrl] = useState('');
  const [extendPrompt, setExtendPrompt] = useState(true);
  const [numberOfImages, setNumberOfImages] = useState(1);
  
  const [status, setStatus] = useState('');
  const [taskId, setTaskId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [videoResults, setVideoResults] = useState(null);

  // Load API token from browser storage when app starts
  useEffect(() => {
    const savedToken = localStorage.getItem('a2e_api_token');
    if (savedToken) {
      setApiToken(savedToken);
    }
  }, []);

  // Save API token to browser storage whenever it changes
  const handleApiTokenChange = (newToken) => {
    setApiToken(newToken);
    if (newToken) {
      localStorage.setItem('a2e_api_token', newToken);
    } else {
      localStorage.removeItem('a2e_api_token');
    }
  };

  // Clear saved API token
  const clearSavedToken = () => {
    setApiToken('');
    localStorage.removeItem('a2e_api_token');
    setStatus('API token cleared from browser storage');
  };

  // Handle local image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert Google Drive URL to direct link
  const convertGoogleDriveUrl = () => {
    if (!googleDriveUrl) {
      setError('Please paste a Google Drive URL first');
      return;
    }

    setError('');

    // Extract file ID from various Google Drive URL formats
    let fileId = '';
    
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const match1 = googleDriveUrl.match(/\/file\/d\/([^\/]+)/);
    if (match1) {
      fileId = match1[1];
    }
    
    // Format: https://drive.google.com/open?id=FILE_ID
    const match2 = googleDriveUrl.match(/[?&]id=([^&]+)/);
    if (match2) {
      fileId = match2[1];
    }

    if (fileId) {
      const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      setImageUrl(directUrl);
      setStatus('Google Drive URL converted successfully! You can now generate the video.');
      
      // Load preview
      setImagePreview(directUrl);
    } else {
      setError('Could not extract File ID from the Google Drive URL. Please make sure you copied the full sharing link.');
    }
  };

  // Upload image to ImgBB (free image hosting)
  const uploadImageToHost = async () => {
    if (!imageFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Uploading image to hosting service...');

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // Using ImgBB free API (you can get a free API key at https://api.imgbb.com/)
      const imgbbApiKey = 'YOUR_IMGBB_API_KEY'; // Users need to replace this
      
      if (imgbbApiKey === 'YOUR_IMGBB_API_KEY') {
        setError('You need to set up image hosting. See instructions below.');
        setStatus('');
        setLoading(false);
        return;
      }

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setImageUrl(data.data.url);
        setStatus('Image uploaded successfully! You can now generate the video.');
      } else {
        setError('Failed to upload image. Please enter the image URL manually.');
      }
    } catch (err) {
      setError('Failed to upload image: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Start video generation
  const startVideoGeneration = async () => {
    if (!apiToken) {
      setError('Please enter your API token');
      return;
    }
    if (!imageUrl) {
      setError('Please provide an image URL (upload your image or paste the URL)');
      return;
    }
    if (!prompt) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Starting video generation...');
    setVideoResults(null);

    try {
      const requestBody = {
        name: name || `Video ${new Date().toLocaleString()}`,
        image_url: imageUrl,
        prompt: prompt,
        negative_prompt: negativePrompt,
        model_type: modelType,
        video_length: parseInt(videoLength),
        extend_prompt: extendPrompt,
        number_of_images: numberOfImages
      };

      // Add end_image_url only if using FLF2V model
      if (modelType === 'FLF2V' && endImageUrl) {
        requestBody.end_image_url = endImageUrl;
      }

      const response = await fetch('https://video.a2e.ai/api/v1/userImage2Video/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.code === 0 && data.data) {
        setTaskId(data.data._id);
        setStatus('Video generation started! Task ID: ' + data.data._id);
        setError('');
      } else {
        setError('Failed to start video generation: ' + (data.message || 'Unknown error'));
        setStatus('');
      }
    } catch (err) {
      setError('Error: ' + err.message);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  // Check video status
  const checkVideoStatus = async () => {
    if (!apiToken) {
      setError('Please enter your API token');
      return;
    }

    setCheckingStatus(true);
    setError('');

    try {
      const response = await fetch('https://video.a2e.ai/api/v1/userImage2Video/allRecords', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.code === 0 && data.data) {
        // Find the current task if we have a taskId
        if (taskId) {
          const currentTask = data.data.find(task => task._id === taskId);
          if (currentTask) {
            setVideoResults(currentTask);
            setStatus(`Status: ${currentTask.current_status}`);
          }
        } else {
          // Show all videos
          setVideoResults(data.data);
          setStatus(`Found ${data.data.length} video(s)`);
        }
      } else {
        setError('Failed to fetch video status: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      setError('Error checking status: ' + err.message);
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a' }}>
        Image to Video Generator
      </h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Transform your images into stunning videos using AI
      </p>

      {/* API Token Section */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} />
          Step 1: Enter Your API Token
        </h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => handleApiTokenChange(e.target.value)}
            placeholder="Paste your Bearer token here"
            style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          />
          <button
            onClick={clearSavedToken}
            disabled={!apiToken}
            style={{
              padding: '12px 16px',
              backgroundColor: apiToken ? '#dc2626' : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: apiToken ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>
        {apiToken && (
          <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', borderRadius: '6px', padding: '10px', marginBottom: '8px' }}>
            <p style={{ fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={16} />
              ✨ API token saved! It will auto-fill next time you visit.
            </p>
          </div>
        )}
        <p style={{ fontSize: '13px', color: '#666' }}>
          Get your API token from the A2E.ai dashboard. It will be saved in your browser for convenience.
        </p>
      </div>

      {/* Image Upload Section */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={20} />
          Step 2: Upload Your Image
        </h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Select Image File
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          />
        </div>

        {imagePreview && (
          <div style={{ marginBottom: '15px' }}>
            <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid #e5e5e5' }} />
          </div>
        )}

        <div style={{ backgroundColor: '#e0f2fe', border: '1px solid #38bdf8', borderRadius: '6px', padding: '15px', marginBottom: '15px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#075985', marginBottom: '10px' }}>
            ✨ Use Google Drive Images (Easy Method)
          </p>
          <p style={{ fontSize: '13px', color: '#0c4a6e', marginBottom: '10px' }}>
            Paste your Google Drive sharing link below and click Convert. The tool will automatically create the direct link needed for the API.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
            <input
              type="text"
              value={googleDriveUrl}
              onChange={(e) => setGoogleDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view"
              style={{ flex: 1, padding: '10px', border: '1px solid #7dd3fc', borderRadius: '6px', fontSize: '14px' }}
            />
            <button
              onClick={convertGoogleDriveUrl}
              style={{
                padding: '10px 20px',
                backgroundColor: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Convert URL
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#0c4a6e' }}>
            <strong>Tip:</strong> Make sure your Google Drive file is shared as "Anyone with the link can view"
          </p>
        </div>

        <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '6px', padding: '12px', marginBottom: '15px' }}>
          <p style={{ fontSize: '13px', color: '#92400e', marginBottom: '8px' }}>
            <strong>Other Options:</strong>
          </p>
          <p style={{ fontSize: '13px', color: '#92400e', marginBottom: '4px' }}>
            • Upload to <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8', textDecoration: 'underline' }}>ImgBB.com</a> and paste the URL below
          </p>
          <p style={{ fontSize: '13px', color: '#92400e' }}>
            • Or paste any direct image URL you already have
          </p>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Image URL (Auto-filled from Google Drive, or paste directly)
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/your-image.jpg or use Google Drive converter above"
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          />
        </div>
      </div>

      {/* Video Settings Section */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Play size={20} />
          Step 3: Configure Video Settings
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Video Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My awesome video"
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Video Length
            </label>
            <select
              value={videoLength}
              onChange={(e) => setVideoLength(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            >
              <option value="81">5 seconds (81 frames)</option>
              <option value="129">8 seconds (129 frames)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Model Type
            </label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            >
              <option value="I2V">I2V (Standard)</option>
              <option value="GENERAL">General</option>
              <option value="FLF2V">FLF2V (Requires end image)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Number of Videos
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={numberOfImages}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setNumberOfImages(isNaN(value) ? 1 : Math.max(1, Math.min(5, value)));
              }}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>
        </div>

        {modelType === 'FLF2V' && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              End Image URL (Required for FLF2V)
            </label>
            <input
              type="url"
              value={endImageUrl}
              onChange={(e) => setEndImageUrl(e.target.value)}
              placeholder="https://example.com/end-image.jpg"
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Prompt (What you want to happen)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="the person is speaking. Looking at the camera. detailed eyes, clear teeth, static view point, still background"
            rows="3"
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
            Negative Prompt (What to avoid)
          </label>
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="blurry, low quality, chaotic, deformed"
            rows="2"
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="extendPrompt"
            checked={extendPrompt}
            onChange={(e) => setExtendPrompt(e.target.checked)}
            style={{ width: '18px', height: '18px' }}
          />
          <label htmlFor="extendPrompt" style={{ fontSize: '14px', cursor: 'pointer' }}>
            Extend prompt automatically (AI will enhance your prompt)
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={startVideoGeneration}
          disabled={loading || !apiToken || !imageUrl || !prompt}
          style={{
            flex: 1,
            padding: '14px 24px',
            backgroundColor: loading || !apiToken || !imageUrl || !prompt ? '#d1d5db' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading || !apiToken || !imageUrl || !prompt ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {loading ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={20} />}
          {loading ? 'Generating...' : 'Generate Video'}
        </button>

        <button
          onClick={checkVideoStatus}
          disabled={checkingStatus || !apiToken}
          style={{
            padding: '14px 24px',
            backgroundColor: checkingStatus || !apiToken ? '#d1d5db' : '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: checkingStatus || !apiToken ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {checkingStatus ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={20} />}
          Check Status
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          <p style={{ color: '#991b1b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            {error}
          </p>
        </div>
      )}

      {status && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          <p style={{ color: '#166534', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            {status}
          </p>
        </div>
      )}

      {/* Results Section */}
      {videoResults && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            Video Results
          </h2>
          
          {Array.isArray(videoResults) ? (
            <div style={{ display: 'grid', gap: '15px' }}>
              {videoResults.map((video) => (
                <div key={video._id} style={{ border: '1px solid #e5e5e5', borderRadius: '8px', padding: '15px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>{video.name}</h3>
                  <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Status:</strong> <span style={{ 
                      color: video.current_status === 'completed' ? '#059669' : video.current_status === 'failed' ? '#dc2626' : '#d97706',
                      fontWeight: '600'
                    }}>{video.current_status}</span>
                  </p>
                  <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Created:</strong> {new Date(video.createdAt).toLocaleString()}
                  </p>
                  {video.video_url && (
                    <div style={{ marginTop: '12px' }}>
                      <video controls style={{ width: '100%', maxHeight: '400px', borderRadius: '8px', marginBottom: '10px' }}>
                        <source src={video.video_url} type="video/mp4" />
                      </video>
                      <a 
                        href={video.video_url} 
                        download
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 20px',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        <Download size={18} />
                        Download Video
                      </a>
                    </div>
                  )}
                  {video.failed_message && (
                    <p style={{ fontSize: '14px', color: '#dc2626', marginTop: '8px' }}>
                      <strong>Error:</strong> {video.failed_message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ border: '1px solid #e5e5e5', borderRadius: '8px', padding: '15px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>{videoResults.name}</h3>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                <strong>Status:</strong> <span style={{ 
                  color: videoResults.current_status === 'completed' ? '#059669' : videoResults.current_status === 'failed' ? '#dc2626' : '#d97706',
                  fontWeight: '600'
                }}>{videoResults.current_status}</span>
              </p>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                <strong>Created:</strong> {new Date(videoResults.createdAt).toLocaleString()}
              </p>
              {videoResults.video_url && (
                <div style={{ marginTop: '12px' }}>
                  <video controls style={{ width: '100%', maxHeight: '400px', borderRadius: '8px', marginBottom: '10px' }}>
                    <source src={videoResults.video_url} type="video/mp4" />
                  </video>
                  <a 
                    href={videoResults.video_url} 
                    download
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    <Download size={18} />
                    Download Video
                  </a>
                </div>
              )}
              {videoResults.failed_message && (
                <p style={{ fontSize: '14px', color: '#dc2626', marginTop: '8px' }}>
                  <strong>Error:</strong> {videoResults.failed_message}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
