import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Car, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Mail, 
  Phone,
  ChevronDown,
  Bot,
  ClipboardList,
  Clock,
  Loader2,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import vxgoLogo from '@/assets/vxgo-logo-branca.png';
import heroBg from '@/assets/hero-bg.jpg';

const Institucional = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    observacao: ''
  });

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.telefone) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Using mailto as fallback for email sending
      const mailtoLink = `mailto:tomvalois@gmail.com?subject=Contato via Site VX GO - ${formData.nome}&body=Nome: ${formData.nome}%0D%0AEmail: ${formData.email}%0D%0ATelefone: ${formData.telefone}%0D%0A%0D%0AObservação:%0D%0A${formData.observacao}`;
      window.location.href = mailtoLink;
      
      toast.success('Redirecionando para seu cliente de email...');
      setFormData({ nome: '', email: '', telefone: '', observacao: '' });
    } catch (error) {
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: Car,
      title: 'Gestão de Estoque',
      description: 'Cadastro e controle completo de veículos com fotos, características, valores e anúncios integrados.',
    },
    {
      icon: Bot,
      title: 'Atendimento Automatizado com IA',
      description: 'Respostas inteligentes via WhatsApp e OLX com controle de pausa, followups e intervenções humanas.',
    },
    {
      icon: Users,
      title: 'Gestão de Leads',
      description: 'Visualização de conversas em estilo WhatsApp Web com histórico completo de mensagens.',
    },
    {
      icon: Clock,
      title: 'Followup Inteligente',
      description: 'Agendamento automático de mensagens com controle por data, hora e status de atendimento.',
    },
    {
      icon: BarChart3,
      title: 'Dashboard e Relatórios',
      description: 'Visão geral de estoque, leads e mensagens com gráficos claros para tomada de decisão.',
    },
    {
      icon: ClipboardList,
      title: 'Integração Completa',
      description: 'Conecte WhatsApp e OLX em uma única plataforma para gerenciar todos os seus canais.',
    },
  ];

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-2 transition-transform duration-300 hover:scale-105"
          >
            <img 
              src={vxgoLogo} 
              alt="VX GO" 
              className="h-10 md:h-12 w-auto object-contain"
            />
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-muted-foreground hover:text-foreground transition-all duration-300 relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </button>
            <button 
              onClick={() => scrollToSection('sistema')}
              className="text-muted-foreground hover:text-foreground transition-all duration-300 relative group"
            >
              O Sistema
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </button>
            <button 
              onClick={() => scrollToSection('contato')}
              className="text-muted-foreground hover:text-foreground transition-all duration-300 relative group"
            >
              Fale Conosco
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button 
                variant="default"
                className="hidden md:inline-flex transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
              >
                Entrar
              </Button>
            </Link>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-foreground transition-transform duration-300 hover:scale-110"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-4 bg-background/95 backdrop-blur-md border-t border-border/50 space-y-3">
            <button 
              onClick={() => scrollToSection('home')}
              className="block w-full text-left py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('sistema')}
              className="block w-full text-left py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              O Sistema
            </button>
            <button 
              onClick={() => scrollToSection('contato')}
              className="block w-full text-left py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Fale Conosco
            </button>
            <Link to="/auth" className="block">
              <Button variant="default" className="w-full">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Parallax */}
      <section 
        id="home" 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Parallax Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ 
            backgroundImage: `url(${heroBg})`,
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-background/80" />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight animate-fade-in">
              Automatize atendimentos, organize leads e aumente suas vendas
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Plataforma inteligente para gestão de estoque, leads e automação de atendimento via WhatsApp e OLX.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button 
                size="lg" 
                onClick={() => scrollToSection('sistema')}
                className="gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
              >
                Conheça o Sistema
                <ChevronDown className="h-4 w-4 animate-bounce" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => scrollToSection('contato')}
                className="backdrop-blur-sm bg-background/50 transition-all duration-300 hover:scale-105 hover:bg-background/80"
              >
                Fale Conosco
              </Button>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-muted-foreground" />
        </div>
      </section>

      {/* Features Section */}
      <section id="sistema" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              O Sistema
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Conheça as principais funcionalidades que vão transformar a gestão do seu negócio automotivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group border border-border/50 bg-background/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 hover:border-primary/30"
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:bg-primary/20 group-hover:rotate-3">
                    <feature.icon className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 transition-colors duration-300 group-hover:text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-16 md:py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Fale Conosco
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Quer saber mais sobre a plataforma ou solicitar uma demonstração? Entre em contato conosco!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Left Column - Contact Info */}
            <div className="space-y-6">
              <Card className="bg-background/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-whatsapp/20 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                      <MessageSquare className="h-7 w-7 text-whatsapp" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">WhatsApp</h3>
                      <a 
                        href="https://wa.me/558198888758?text=Ol%C3%A1%20estou%20no%20site%20da%20VX%20GO%20e%20estou%20interessado."
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-whatsapp hover:opacity-80 transition-opacity font-medium text-lg"
                      >
                        Fale Agora: (81) 9 8888-8758
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <a 
                    href="tel:+558198888758"
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <Phone className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Telefone</h3>
                      <span className="text-primary font-medium text-lg">
                        Ligue Agora
                      </span>
                    </div>
                  </a>
                </CardContent>
              </Card>

              <Card className="bg-background/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Mail className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email</h3>
                      <a 
                        href="mailto:tomvalois@gmail.com"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        tomvalois@gmail.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Contact Form */}
            <Card className="bg-background/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-6">Envie uma mensagem</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      placeholder="Seu nome completo"
                      className="bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-all duration-300"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seu@email.com"
                      className="bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-all duration-300"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      placeholder="(00) 00000-0000"
                      className="bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-all duration-300"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observacao">Observação</Label>
                    <Textarea
                      id="observacao"
                      name="observacao"
                      value={formData.observacao}
                      onChange={handleInputChange}
                      placeholder="Conte-nos mais sobre seu interesse..."
                      rows={4}
                      className="bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-all duration-300 resize-none"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Mensagem'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-background border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <button 
            onClick={() => scrollToSection('home')}
            className="inline-flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-105"
          >
            <img 
              src={vxgoLogo} 
              alt="VX GO" 
              className="h-10 w-auto object-contain"
            />
          </button>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VX GO. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Institucional;
