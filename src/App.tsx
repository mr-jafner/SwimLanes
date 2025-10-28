import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex justify-center gap-8 mb-8">
          <a href="https://vite.dev" target="_blank" className="transition-transform hover:scale-110">
            <img src={viteLogo} className="h-24 w-24" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" className="transition-transform hover:scale-110">
            <img src={reactLogo} className="h-24 w-24" alt="React logo" />
          </a>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          SwimLanes + Tailwind CSS
        </h1>

        {/* Counter Card */}
        <div className="max-w-md mx-auto bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-xl p-8 mb-12 border border-slate-700">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Count is {count}
          </button>
          <p className="mt-4 text-center text-slate-300 text-sm">
            Edit <code className="bg-slate-700 px-2 py-1 rounded text-blue-300">src/App.tsx</code> and save to test HMR
          </p>
        </div>

        {/* Custom Theme Colors Test */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center">SwimLanes Item Type Colors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-task/20 border-2 border-task rounded-lg p-6 hover:bg-task/30 transition-colors">
              <div className="w-4 h-4 bg-task rounded-full mb-2"></div>
              <h3 className="font-semibold text-task">Task</h3>
              <p className="text-sm text-slate-300 mt-1">Blue bars for work items</p>
            </div>

            <div className="bg-milestone/20 border-2 border-milestone rounded-lg p-6 hover:bg-milestone/30 transition-colors">
              <div className="w-4 h-4 bg-milestone rounded-full mb-2"></div>
              <h3 className="font-semibold text-milestone">Milestone</h3>
              <p className="text-sm text-slate-300 mt-1">Green diamonds for markers</p>
            </div>

            <div className="bg-release/20 border-2 border-release rounded-lg p-6 hover:bg-release/30 transition-colors">
              <div className="w-4 h-4 bg-release rounded-full mb-2"></div>
              <h3 className="font-semibold text-release">Release</h3>
              <p className="text-sm text-slate-300 mt-1">Orange bars for deployments</p>
            </div>

            <div className="bg-meeting/20 border-2 border-meeting rounded-lg p-6 hover:bg-meeting/30 transition-colors">
              <div className="w-4 h-4 bg-meeting rounded-full mb-2"></div>
              <h3 className="font-semibold text-meeting">Meeting</h3>
              <p className="text-sm text-slate-300 mt-1">Purple bars for events</p>
            </div>
          </div>
        </div>

        {/* Responsive Test */}
        <p className="text-center text-slate-400 mt-12 text-xs sm:text-sm md:text-base">
          Responsive text sizing test
        </p>
      </div>
    </div>
  )
}

export default App
