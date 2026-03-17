import React, { useState } from 'react';
import { MaskBroIndicator, TikiButton, selectMaskBro } from '../components/tiki';
import type { MaskBroType, Sentiment } from '../components/tiki';

/**
 * TikiDemo Page
 *
 * Showcases the tiki rebrand components for Prophecy
 * Used for testing and demonstrating the new visual identity
 */
export default function TikiDemo() {
  const [_isLoading, setIsLoading] = useState(false);
  const [selectedMaskBro, setSelectedMaskBro] = useState<MaskBroType>('smirk');

  // Sample market data for demonstration
  const sampleMarkets = [
    { question: 'Will Bitcoin hit $100k by EOY 2025?', yesOdds: 67, volume: 5000 },
    { question: 'Will ETH flip BTC in market cap?', yesOdds: 23, volume: 2000 },
    { question: 'Will Base reach 1M daily users?', yesOdds: 48, volume: 15000 },
    { question: 'Will there be a crypto ETF approval?', yesOdds: 85, volume: 8000, volatility: 25 },
  ];

  const handleLoadingTest = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-tiki-charcoal">
      {/* Header */}
      <header className="bg-gradient-to-r from-tiki-deep-teal to-tiki-turquoise border-b-4 border-tiki-mango py-6">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-5xl animate-bounce-slow">🗿</span>
              <div>
                <h1 className="font-baloo text-4xl text-tiki-coconut font-bold">Prophecy</h1>
                <p className="text-tiki-coconut/70 text-sm">Tiki Rebrand Demo</p>
              </div>
            </div>
            <TikiButton variant="primary" emoji="🌺" size="lg">
              Launch App
            </TikiButton>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Introduction */}
        <section className="mb-16 text-center">
          <h2 className="font-baloo text-5xl text-tiki-turquoise mb-4">
            Welcome to the Tiki Era
          </h2>
          <p className="text-tiki-coconut/80 text-xl max-w-2xl mx-auto">
            Where degens bet on what's <em>probably</em> true, guided by the wise Council of MaskBros
          </p>
        </section>

        {/* Color Palette */}
        <section className="mb-16">
          <h3 className="font-baloo text-3xl text-tiki-coconut mb-6">🎨 Tiki Color Palette</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Turquoise', class: 'bg-tiki-turquoise', hex: '#00CFC1' },
              { name: 'Coral', class: 'bg-tiki-coral', hex: '#FF6B6B' },
              { name: 'Mango', class: 'bg-tiki-mango', hex: '#FFB347' },
              { name: 'Deep Teal', class: 'bg-tiki-deep-teal', hex: '#0A5F5F' },
              { name: 'Coconut', class: 'bg-tiki-coconut', hex: '#FFF8E7', dark: true },
              { name: 'Volcano', class: 'bg-tiki-volcano', hex: '#E63946' },
              { name: 'Lagoon', class: 'bg-tiki-lagoon', hex: '#4ECDC4' },
              { name: 'Bamboo', class: 'bg-tiki-bamboo', hex: '#90BE6D' },
            ].map((color) => (
              <div key={color.name} className="rounded-xl overflow-hidden shadow-lg">
                <div className={`${color.class} h-24`}></div>
                <div className="bg-tiki-charcoal/50 p-3">
                  <div className={`font-baloo font-semibold ${color.dark ? 'text-tiki-charcoal' : 'text-tiki-coconut'}`}>
                    {color.name}
                  </div>
                  <div className="text-tiki-driftwood text-xs font-mono">{color.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MaskBro Council */}
        <section className="mb-16">
          <h3 className="font-baloo text-3xl text-tiki-coconut mb-6">🎭 The Council of MaskBros</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { type: 'smirk' as MaskBroType, name: 'SmirkBro', emoji: '😏', desc: 'Optimistic consensus', sentiment: 'bullish' as Sentiment },
              { type: 'sad' as MaskBroType, name: 'SadBro', emoji: '😔', desc: 'Bearish warnings', sentiment: 'bearish' as Sentiment },
              { type: 'wise' as MaskBroType, name: 'WiseBro', emoji: '🧙', desc: 'Historical accuracy', sentiment: 'bullish' as Sentiment },
              { type: 'crazy' as MaskBroType, name: 'CrazyBro', emoji: '🤪', desc: 'High volatility', sentiment: 'bullish' as Sentiment },
              { type: 'chill' as MaskBroType, name: 'ChillBro', emoji: '😎', desc: 'Balanced analysis', sentiment: 'neutral' as Sentiment },
            ].map((bro) => (
              <button
                key={bro.type}
                onClick={() => setSelectedMaskBro(bro.type)}
                className={`
                  bg-gradient-to-br from-tiki-deep-teal to-tiki-charcoal
                  border-2 rounded-2xl p-6 text-center
                  transform transition-all duration-200
                  hover:scale-105 hover:shadow-glow
                  ${selectedMaskBro === bro.type ? 'border-tiki-mango shadow-glow-mango' : 'border-tiki-driftwood/30'}
                `}
              >
                <div className="text-5xl mb-3 animate-bounce-slow">{bro.emoji}</div>
                <div className="font-baloo text-xl text-tiki-coconut font-bold mb-1">{bro.name}</div>
                <div className="text-tiki-driftwood text-sm">{bro.desc}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 bg-tiki-deep-teal/50 rounded-2xl p-6">
            <h4 className="font-baloo text-xl text-tiki-coconut mb-4">MaskBro Indicator Examples</h4>
            <div className="flex flex-wrap gap-4">
              <MaskBroIndicator type="smirk" sentiment="bullish" confidence={8} />
              <MaskBroIndicator type="sad" sentiment="bearish" confidence={6} />
              <MaskBroIndicator type="wise" sentiment="bullish" confidence={9} />
              <MaskBroIndicator type="crazy" sentiment="bullish" confidence={4} />
              <MaskBroIndicator type="chill" sentiment="neutral" confidence={5} />
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h3 className="font-baloo text-3xl text-tiki-coconut mb-6">🔘 Tiki Buttons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Variants */}
            <div className="bg-tiki-deep-teal/50 rounded-2xl p-6">
              <h4 className="font-baloo text-xl text-tiki-coconut mb-4">Variants</h4>
              <div className="flex flex-col gap-3">
                <TikiButton variant="primary" emoji="🌺">Primary Button</TikiButton>
                <TikiButton variant="secondary" emoji="🌊">Secondary Button</TikiButton>
                <TikiButton variant="success" emoji="✅">Success Button</TikiButton>
                <TikiButton variant="danger" emoji="⚠️">Danger Button</TikiButton>
              </div>
            </div>

            {/* Sizes */}
            <div className="bg-tiki-deep-teal/50 rounded-2xl p-6">
              <h4 className="font-baloo text-xl text-tiki-coconut mb-4">Sizes</h4>
              <div className="flex flex-col gap-3 items-start">
                <TikiButton variant="primary" size="sm" emoji="🌺">Small</TikiButton>
                <TikiButton variant="primary" size="md" emoji="🌺">Medium</TikiButton>
                <TikiButton variant="primary" size="lg" emoji="🌺">Large</TikiButton>
              </div>
            </div>

            {/* States */}
            <div className="bg-tiki-deep-teal/50 rounded-2xl p-6">
              <h4 className="font-baloo text-xl text-tiki-coconut mb-4">States</h4>
              <div className="flex flex-col gap-3">
                <TikiButton variant="primary" emoji="🎯" onClick={handleLoadingTest}>
                  Normal
                </TikiButton>
                <TikiButton variant="primary" emoji="🎯" loading={true}>
                  Loading...
                </TikiButton>
                <TikiButton variant="primary" emoji="🎯" disabled>
                  Disabled
                </TikiButton>
              </div>
            </div>

            {/* Full Width */}
            <div className="bg-tiki-deep-teal/50 rounded-2xl p-6">
              <h4 className="font-baloo text-xl text-tiki-coconut mb-4">Full Width</h4>
              <TikiButton variant="primary" emoji="🚀" fullWidth>
                Place Bet
              </TikiButton>
            </div>
          </div>
        </section>

        {/* Sample Market Cards */}
        <section className="mb-16">
          <h3 className="font-baloo text-3xl text-tiki-coconut mb-6">📊 Market Cards (With MaskBros)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sampleMarkets.map((market) => {
              const { type, sentiment, confidence } = selectMaskBro(
                market.yesOdds,
                market.volume,
                market.volatility
              );

              return (
                <div
                  key={market.question}
                  className="bg-gradient-to-br from-tiki-deep-teal to-tiki-turquoise/20 border-2 border-tiki-mango/50 rounded-2xl p-6 shadow-glow hover:shadow-glow-mango transition-all duration-300 hover:scale-105"
                >
                  {/* MaskBro Indicator */}
                  <div className="mb-4">
                    <MaskBroIndicator
                      type={type}
                      sentiment={sentiment}
                      confidence={confidence}
                    />
                  </div>

                  {/* Question */}
                  <h4 className="font-baloo text-xl text-tiki-coconut font-bold mb-4">
                    {market.question}
                  </h4>

                  {/* Odds */}
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <div className="text-tiki-mango text-5xl font-mono font-bold">
                        {market.yesOdds}%
                      </div>
                      <div className="text-tiki-coconut/60 text-sm">YES</div>
                    </div>
                    <div className="text-right">
                      <div className="text-tiki-sunset text-5xl font-mono font-bold">
                        {100 - market.yesOdds}%
                      </div>
                      <div className="text-tiki-coconut/60 text-sm">NO</div>
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="flex justify-between items-center mb-4 text-tiki-coconut/60 text-sm">
                    <span>Volume: ${market.volume.toLocaleString()} USDC</span>
                    {market.volatility && <span>Volatility: {market.volatility}%</span>}
                  </div>

                  {/* Action Button */}
                  <TikiButton variant="primary" emoji="🎯" fullWidth>
                    Place Bet
                  </TikiButton>
                </div>
              );
            })}
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h3 className="font-baloo text-3xl text-tiki-coconut mb-6">📝 Typography</h3>
          <div className="bg-tiki-deep-teal/50 rounded-2xl p-8">
            <h1 className="font-baloo text-5xl text-tiki-turquoise mb-2">Heading 1 - Baloo 2</h1>
            <h2 className="font-baloo text-4xl text-tiki-coral mb-2">Heading 2 - Baloo 2</h2>
            <h3 className="font-baloo text-3xl text-tiki-mango mb-4">Heading 3 - Baloo 2</h3>

            <p className="text-tiki-coconut text-lg mb-4">
              Body text uses Inter font for maximum readability. This is a professional,
              clean font that maintains credibility while the playful Baloo 2 adds personality to headings.
            </p>

            <div className="font-mono text-tiki-lagoon text-3xl mb-2">67.5%</div>
            <div className="text-tiki-driftwood text-sm">Data and odds use JetBrains Mono</div>
          </div>
        </section>

        {/* Animations */}
        <section className="mb-16">
          <h3 className="font-baloo text-3xl text-tiki-coconut mb-6">✨ Animations</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-tiki-deep-teal/50 rounded-2xl p-6 text-center">
              <div className="text-6xl mb-3 animate-spin-slow">🗿</div>
              <div className="text-tiki-coconut text-sm">spin-slow</div>
            </div>
            <div className="bg-tiki-deep-teal/50 rounded-2xl p-6 text-center">
              <div className="text-6xl mb-3 animate-bounce-slow">😏</div>
              <div className="text-tiki-coconut text-sm">bounce-slow</div>
            </div>
            <div className="bg-tiki-deep-teal/50 rounded-2xl p-6 text-center">
              <div className="text-6xl mb-3 animate-wiggle">🤪</div>
              <div className="text-tiki-coconut text-sm">wiggle</div>
            </div>
            <div className="bg-tiki-deep-teal/50 rounded-2xl p-6 text-center">
              <div className="text-6xl mb-3 animate-pulse-glow shadow-glow">🧙</div>
              <div className="text-tiki-coconut text-sm">pulse-glow</div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center py-16">
          <h2 className="font-baloo text-5xl text-tiki-turquoise mb-6">
            Ready to Embrace the Tiki Vibes? 🗿
          </h2>
          <p className="text-tiki-coconut/80 text-xl mb-8 max-w-2xl mx-auto">
            This rebrand brings personality without sacrificing professionalism.
            SmirkBro approves. 😏
          </p>
          <div className="flex gap-4 justify-center">
            <TikiButton variant="primary" size="lg" emoji="🚀">
              Deploy to Production
            </TikiButton>
            <TikiButton variant="secondary" size="lg" emoji="📚">
              Read Strategy Doc
            </TikiButton>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-tiki-deep-teal border-t-2 border-tiki-mango py-8">
        <div className="container mx-auto px-6 text-center text-tiki-coconut/60">
          <div className="text-4xl mb-4">🗿 😏 😔 🧙 🤪 😎</div>
          <p className="mb-2">Prophecy - Where degens bet on what's probably true</p>
          <p className="text-sm">Built with ❤️ and tropical vibes on Base</p>
        </div>
      </footer>
    </div>
  );
}
