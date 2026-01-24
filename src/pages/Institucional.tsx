
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  MessageSquare, 
  Users, 
  Calendar, 
  BarChart3, 
  Mail, 
  Phone,
  ChevronDown,
  Bot,
  ClipboardList,
  Clock
} from 'lucide-react';

const Institucional = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">VX Auto</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('sistema')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              O Sistema
            </button>
            <button 
              onClick={() => scrollToSection('contato')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Fale Conosco
            </button>
          </div>
          <Button 
            variant="default"
            onClick={() => scrollToSection('contato')}
            className="hidden md:inline-flex"
          >
            Contato
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Automatize atendimentos, organize leads e aumente suas vendas
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Plataforma inteligente para gestão de estoque, leads e automação de atendimento via WhatsApp e OLX.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => scrollToSection('sistema')}
                className="gap-2"
              >
                Conheça o Sistema
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => scrollToSection('contato')}
              >
                Fale Conosco
              </Button>
            </div>
          </div>
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
              <Card key={index} className="border border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
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
      <section id="contato" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Fale Conosco
            </h2>
            <p className="text-muted-foreground mb-8">
              Quer saber mais sobre a plataforma ou solicitar uma demonstração? Entre em contato conosco!
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Card className="flex-1 max-w-xs mx-auto sm:mx-0">
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Email</h3>
                  <a 
                    href="mailto:contato@vxauto.com.br" 
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    contato@vxauto.com.br
                  </a>
                </CardContent>
              </Card>

              <Card className="flex-1 max-w-xs mx-auto sm:mx-0">
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">WhatsApp</h3>
                  <a 
                    href="https://wa.me/5581999999999" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    (81) 99999-9999
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-background border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Car className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">VX Auto</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VX Auto. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Institucional;
