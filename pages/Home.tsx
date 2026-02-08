import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Users, Sparkles, Quote } from 'lucide-react';
import Button from '../components/Button';
import { useData } from '../context/DataContext';

const Home: React.FC = () => {
  const { testimonials } = useData();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-purple/20 blur-3xl"></div>
            <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-brand-cyan/20 blur-3xl"></div>
            <div className="absolute bottom-0 right-20 w-80 h-80 rounded-full bg-brand-pink/10 blur-3xl"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center rounded-full bg-brand-cyan/10 px-3 py-1 text-sm font-semibold text-brand-cyan mb-8 border border-brand-cyan/20">
            <span className="flex h-2 w-2 rounded-full bg-brand-cyan mr-2"></span>
            Now accepting new families for Fall 2025
          </div>
          
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl mb-6">
            Play Without <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-purple">Barriers</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-slate-300 mb-10 leading-relaxed">
            Aaria's Blue Elephant is a safe haven where neurodivergent and neurotypical children grow together. 
            We believe in early intervention, inclusive play, and building a compassionate community.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/events">
               <Button size="lg" className="w-full sm:w-auto">
                 Find a Playgroup <ArrowRight className="ml-2 h-5 w-5" />
               </Button>
            </Link>
            <Link to="/about">
               <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                 Our Story
               </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Highlights */}
      <section className="py-16 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-brand-card border border-slate-800 hover:border-brand-cyan/50 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-lg bg-brand-cyan/20 flex items-center justify-center mb-4 group-hover:bg-brand-cyan/30 transition-colors">
                <Users className="h-6 w-6 text-brand-cyan" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Inclusive Community</h3>
              <p className="text-slate-400">Bridging the gap between neurodivergent and neurotypical peers through shared experiences and understanding.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-brand-card border border-slate-800 hover:border-brand-purple/50 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-lg bg-brand-purple/20 flex items-center justify-center mb-4 group-hover:bg-brand-purple/30 transition-colors">
                <Sparkles className="h-6 w-6 text-brand-purple" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Early Intervention</h3>
              <p className="text-slate-400">Raising awareness about the critical importance of early therapy and developmental support for holistic growth.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-brand-card border border-slate-800 hover:border-brand-pink/50 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-lg bg-brand-pink/20 flex items-center justify-center mb-4 group-hover:bg-brand-pink/30 transition-colors">
                <Heart className="h-6 w-6 text-brand-pink" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Compassionate Care</h3>
              <p className="text-slate-400">Creating safe, non-judgmental spaces where every child is celebrated for exactly who they are.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-brand-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white">Voices of our Community</h2>
                <p className="text-slate-400 mt-2">Hear from the families and supporters who make us who we are.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.slice(0, 3).map((item) => (
                    <div key={item.id} className="bg-brand-card border border-slate-800 p-6 rounded-2xl relative hover:-translate-y-1 transition-transform duration-300">
                        <Quote className="absolute top-6 right-6 h-8 w-8 text-slate-700 opacity-50" />
                        <p className="text-slate-300 mb-6 italic leading-relaxed">"{item.content}"</p>
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-slate-700 overflow-hidden">
                                {item.avatar ? (
                                    <img src={item.avatar} alt={item.author} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-brand-cyan to-brand-purple text-white text-xs font-bold">
                                        {item.author.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">{item.author}</p>
                                <p className="text-brand-cyan text-xs">{item.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-purple to-brand-pink opacity-10"></div>
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <h2 className="text-3xl font-bold text-white mb-6">Ready to Join Our Herd?</h2>
              <p className="text-slate-300 mb-8 text-lg">
                  Whether you're looking for support, want to volunteer, or can help us grow with a donation, 
                  there's a place for you at Aaria's Blue Elephant.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/signup">
                    <Button size="lg">Get Started</Button>
                  </Link>
                  <Link to="/donate">
                    <Button variant="outline" size="lg">Make a Donation</Button>
                  </Link>
              </div>
          </div>
      </section>
    </div>
  );
};

export default Home;