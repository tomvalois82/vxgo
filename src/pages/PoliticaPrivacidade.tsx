import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import vxgoLogo from '@/assets/vxgo-logo-branca.png';

const PoliticaPrivacidade = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            to="/institucional"
            className="flex items-center gap-2 transition-transform duration-300 hover:scale-105"
          >
            <img 
              src={vxgoLogo} 
              alt="VX GO" 
              className="h-10 md:h-12 w-auto object-contain"
            />
          </Link>
          
          <Link to="/institucional">
            <Button 
              variant="outline"
              className="gap-2 backdrop-blur-sm bg-background/50 transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Política de Privacidade
              </h1>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
            </div>

            {/* Content Card */}
            <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-10 shadow-lg">
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="text-lg leading-relaxed mb-6">
                  A sua privacidade é importante para nós. É política do <strong className="text-foreground">VX GO - VX Motors</strong> respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site{' '}
                  <a 
                    href="https://app.vxmotors.com.br" 
                    className="text-primary hover:underline transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    VX GO - VX Motors
                  </a>
                  , e outros sites que possuímos e operamos.
                </p>

                <p className="leading-relaxed mb-6">
                  Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
                </p>

                <p className="leading-relaxed mb-6">
                  Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
                </p>

                <p className="leading-relaxed mb-6">
                  Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
                </p>

                <p className="leading-relaxed mb-6">
                  O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas respectivas{' '}
                  <a 
                    href="https://politicaprivacidade.com/" 
                    className="text-primary hover:underline transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    políticas de privacidade
                  </a>.
                </p>

                <p className="leading-relaxed mb-6">
                  Você é livre para recusar a nossa solicitação de informações pessoais, entendendo que talvez não possamos fornecer alguns dos serviços desejados.
                </p>

                <p className="leading-relaxed mb-8">
                  O uso continuado de nosso site será considerado como aceitação de nossas práticas em torno de privacidade e informações pessoais. Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações pessoais, entre em contacto connosco.
                </p>

                <ul className="list-disc pl-6 space-y-4 mb-8">
                  <li>
                    O serviço Google AdSense que usamos para veicular publicidade usa um cookie DoubleClick para veicular anúncios mais relevantes em toda a Web e limitar o número de vezes que um determinado anúncio é exibido para você.
                  </li>
                  <li>
                    Para mais informações sobre o Google AdSense, consulte as FAQs oficiais sobre privacidade do Google AdSense.
                  </li>
                  <li>
                    Utilizamos anúncios para compensar os custos de funcionamento deste site e fornecer financiamento para futuros desenvolvimentos. Os cookies de publicidade comportamental usados por este site foram projetados para garantir que você forneça os anúncios mais relevantes sempre que possível, rastreando anonimamente seus interesses e apresentando coisas semelhantes que possam ser do seu interesse.
                  </li>
                  <li>
                    Vários parceiros anunciam em nosso nome e os cookies de rastreamento de afiliados simplesmente nos permitem ver se nossos clientes acessaram o site através de um dos sites de nossos parceiros, para que possamos creditá-los adequadamente e, quando aplicável, permitir que nossos parceiros afiliados ofereçam qualquer promoção que pode fornecê-lo para fazer uma compra.
                  </li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mt-10 mb-6">
                  Compromisso do Usuário
                </h2>

                <p className="leading-relaxed mb-6">
                  O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o VX GO - VX Motors oferece no site e com caráter enunciativo, mas não limitativo:
                </p>

                <ul className="list-disc pl-6 space-y-4 mb-8">
                  <li>
                    <strong className="text-foreground">A)</strong> Não se envolver em atividades que sejam ilegais ou contrárias à boa fé e à ordem pública;
                  </li>
                  <li>
                    <strong className="text-foreground">B)</strong> Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, jogos de sorte ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;
                  </li>
                  <li>
                    <strong className="text-foreground">C)</strong> Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do VX GO - VX Motors, de seus fornecedores ou terceiros, para introduzir ou disseminar vírus informáticos ou quaisquer outros sistemas de hardware ou software que sejam capazes de causar danos anteriormente mencionados.
                  </li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mt-10 mb-6">
                  Mais informações
                </h2>

                <p className="leading-relaxed mb-6">
                  Esperemos que esteja esclarecido e, como mencionado anteriormente, se houver algo que você não tem certeza se precisa ou não, geralmente é mais seguro deixar os cookies ativados, caso interaja com um dos recursos que você usa em nosso site.
                </p>

                <p className="leading-relaxed text-sm text-muted-foreground/80 mt-8 pt-6 border-t border-border/50">
                  Esta política é efetiva a partir de <strong>24 de Janeiro de 2026 às 15:07</strong>
                </p>
              </div>
            </div>

            {/* Back to top button */}
            <div className="mt-8 text-center">
              <Button 
                variant="outline"
                onClick={scrollToTop}
                className="backdrop-blur-sm bg-background/50 transition-all duration-300 hover:scale-105"
              >
                Voltar ao topo
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-background border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <Link 
            to="/institucional"
            className="inline-flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-105"
          >
            <img 
              src={vxgoLogo} 
              alt="VX GO" 
              className="h-10 w-auto object-contain"
            />
          </Link>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VX GO. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PoliticaPrivacidade;
