/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';

export default function App() {
  return (
    <div className="main-container bg-[#050505] text-white font-sans overflow-x-hidden">
      {/* Fixed 3D Canvas Background */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <Scene />
        </Canvas>
      </div>

      {/* Scrollable Content */}
      <div className="relative z-10 w-full pointer-events-none">
        {/* Hero Section */}
        <section className="h-screen flex flex-col items-center justify-center">
          <div className="pointer-events-auto text-center">
            <h1 className="text-7xl md:text-9xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">
              NEBULA
            </h1>
            <p className="text-xl md:text-2xl text-white/60 font-light tracking-wide uppercase">
              Scroll to explore
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="h-screen flex items-center justify-start px-[10%]">
          <div className="max-w-xl backdrop-blur-sm bg-black/20 p-8 rounded-2xl border border-white/10 pointer-events-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Custom Geometry
            </h2>
            <p className="text-lg text-white/70 leading-relaxed">
              The sphere is displaced using simplex noise in the vertex shader, creating an organic, ever-changing shape that breaks away from a perfect mathematical sphere.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="h-screen flex items-center justify-end px-[10%]">
          <div className="max-w-xl text-right backdrop-blur-sm bg-black/20 p-8 rounded-2xl border border-white/10 pointer-events-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Procedural Color Maps
            </h2>
            <p className="text-lg text-white/70 leading-relaxed">
              Instead of static image textures, the nebula effect is generated entirely through math. Fractional Brownian Motion (FBM) combined with cosine palettes creates infinite, fluid color variations.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
