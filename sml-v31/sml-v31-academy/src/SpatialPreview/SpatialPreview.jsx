import App from '../App/App.jsx';
import './spatial-preview.css';

// Preview isolated on /spatial-preview: uses the real SML structure, content and interactions.
// The original SceneCanvas remains the single 3D world; no duplicate Canvas is mounted.
export default function SpatialPreview() {
  return (
    <div className="sml-spatial-preview">
      <App />
    </div>
  );
}
