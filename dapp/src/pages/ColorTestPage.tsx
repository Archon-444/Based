import { useTheme } from '../contexts/ThemeContext';

export default function ColorTestPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold mb-4">BASED Color Test</h1>
          <p className="text-lg mb-6">Current theme: <span className="font-bold">{theme}</span></p>
          <button
            onClick={toggleTheme}
            className="btn-primary px-6 py-3"
          >
            Toggle Theme
          </button>
        </div>

        {/* Background Test */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-4">Background Colors</h2>
          <div className="space-y-2">
            <div className="p-4 bg-gray-50 dark:bg-[#0A0E27] border border-gray-300 dark:border-[#1F2847]">
              Body Background: bg-gray-50 / dark:bg-[#0A0E27]
            </div>
            <div className="p-4 bg-white dark:bg-[#141B3D] border border-gray-200 dark:border-[#1F2847]">
              Card Background: bg-white / dark:bg-[#141B3D]
            </div>
          </div>
        </div>

        {/* Primary Colors */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-4">Primary Colors (Electric Blue)</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-primary-500 text-white text-center rounded">
              primary-500<br/>#00D4FF
            </div>
            <div className="p-4 bg-primary-600 text-white text-center rounded">
              primary-600
            </div>
            <div className="p-4 bg-primary-700 text-white text-center rounded">
              primary-700
            </div>
          </div>
        </div>

        {/* Secondary Colors */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-4">Secondary Colors (Deep Purple)</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-secondary-500 text-white text-center rounded">
              secondary-500<br/>#6B4CE6
            </div>
            <div className="p-4 bg-secondary-600 text-white text-center rounded">
              secondary-600
            </div>
            <div className="p-4 bg-secondary-700 text-white text-center rounded">
              secondary-700
            </div>
          </div>
        </div>

        {/* Accent Colors */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-4">Accent Colors (Neon Cyan)</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-accent-500 text-gray-900 text-center rounded">
              accent-500<br/>#00FFF0
            </div>
            <div className="p-4 bg-accent-600 text-white text-center rounded">
              accent-600
            </div>
            <div className="p-4 bg-accent-700 text-white text-center rounded">
              accent-700
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-4">Button Styles</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary px-6 py-2">Primary Button</button>
            <button className="btn-secondary px-6 py-2">Secondary Button</button>
            <button className="btn-success px-6 py-2">Success Button</button>
            <button className="btn-error px-6 py-2">Error Button</button>
          </div>
        </div>

        {/* Gradients */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-4">Gradients</h2>
          <div className="space-y-4">
            <div className="p-8 bg-gradient-to-r gradient-primary text-white text-center rounded-lg font-bold">
              Gradient Primary (Blue → Purple)
            </div>
            <div className="p-8 bg-gradient-to-r gradient-secondary text-white text-center rounded-lg font-bold">
              Gradient Secondary (Purple → Cyan)
            </div>
            <div className="p-8 bg-gradient-to-r gradient-accent text-white text-center rounded-lg font-bold">
              Gradient Accent (Pink → Yellow)
            </div>
          </div>
        </div>

        {/* Glow Effects */}
        <div className="card p-6 bg-gray-900">
          <h2 className="text-2xl font-bold mb-4 text-white">Glow Effects (Best in Dark Mode)</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="p-6 bg-primary-500 glow-primary rounded-lg text-center text-white font-bold">
              Primary Glow
            </div>
            <div className="p-6 bg-secondary-500 glow-secondary rounded-lg text-center text-white font-bold">
              Secondary Glow
            </div>
            <div className="p-6 bg-accent-500 glow-accent rounded-lg text-center text-gray-900 font-bold">
              Accent Glow
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-4">Text Colors</h2>
          <p className="mb-2">Normal text: text-gray-900 / dark:text-gray-100</p>
          <p className="text-primary-500 mb-2">Primary text: text-primary-500</p>
          <p className="text-secondary-500 mb-2">Secondary text: text-secondary-500</p>
          <p className="text-accent-500 mb-2">Accent text: text-accent-500</p>
          <p className="text-gradient gradient-primary mb-2 text-4xl font-bold">
            Gradient Text
          </p>
        </div>

        {/* Inputs */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-4">Input Fields</h2>
          <input
            type="text"
            className="input w-full mb-4"
            placeholder="Test input field"
          />
          <textarea
            className="input w-full"
            placeholder="Test textarea"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
