import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Globe, Zap, Shield, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <header className="gradient-bg text-white">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            <span className="text-xl font-bold">SMB Market Intelligence</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-white text-primary hover:bg-white/90">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
        
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Competitive Intelligence for<br />
            SMB Connectivity Services
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Analyze broadband, mobile, and business solutions from major providers across North America.
            Compare Comcast Business, AT&T, Verizon, T-Mobile, and all major MSOs in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Providers Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-center text-sm font-semibold text-muted-foreground mb-8 uppercase tracking-wider">
            Comprehensive Coverage of Major Providers
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <div className="px-6 py-3 rounded-lg bg-[#0070d1] text-white font-bold">Comcast Business</div>
            <div className="px-6 py-3 rounded-lg bg-[#00a8e0] text-white font-bold">AT&T Business</div>
            <div className="px-6 py-3 rounded-lg bg-[#cd040b] text-white font-bold">Verizon Business</div>
            <div className="px-6 py-3 rounded-lg bg-[#e20074] text-white font-bold">T-Mobile for Business</div>
            <div className="px-6 py-3 rounded-lg bg-[#0077c8] text-white font-bold">Spectrum Business</div>
            <div className="px-6 py-3 rounded-lg bg-[#f26522] text-white font-bold">Cox Business</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything You Need for Competitive Analysis
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            On-demand data refresh, head-to-head comparisons, and comprehensive matrix views 
            with full citation tracking.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>On-Demand Refresh</CardTitle>
                <CardDescription>
                  Fetch the latest offers and pricing whenever you need them with a single click
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Matrix Comparison</CardTitle>
                <CardDescription>
                  Compare multiple providers and plans side-by-side with customizable columns and filters
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Head-to-Head</CardTitle>
                <CardDescription>
                  Deep dive comparisons between specific providers highlighting key differences
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Full Citations</CardTitle>
                <CardDescription>
                  Every data point links back to its source for complete transparency and verification
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Service Categories We Track
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle>Broadband</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Fiber Internet</li>
                  <li>Cable Internet</li>
                  <li>Dedicated Internet Access</li>
                  <li>Ethernet Services</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle>Mobile & Wireless</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Business Mobile Plans</li>
                  <li>5G Solutions</li>
                  <li>IoT Connectivity</li>
                  <li>Mobile Device Management</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle>Voice & Solutions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Business Voice</li>
                  <li>UCaaS</li>
                  <li>SD-WAN</li>
                  <li>Security Services</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Sign up now and start analyzing SMB services from major providers.
            Bring your own LLM API key for intelligent analysis.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <BarChart3 className="h-6 w-6" />
              <span className="font-semibold text-white">SMB Market Intelligence</span>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} SMB Market Intelligence. Built by <span className="text-white font-semibold">CMACLABS</span>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
