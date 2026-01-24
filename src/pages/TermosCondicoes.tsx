import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import vxgoLogo from '@/assets/vxgo-logo-branca.png';

const TermosCondicoes = () => {
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
                Termos e Condições
              </h1>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
            </div>

            {/* Content Card */}
            <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-10 shadow-lg">
              <div className="prose prose-lg max-w-none text-muted-foreground">
                
                <h2 className="text-2xl font-bold text-foreground mt-0 mb-6">
                  1. Termos
                </h2>
                <p className="leading-relaxed mb-8">
                  Ao acessar ao site{' '}
                  <a 
                    href="https://app.vxmotors.com.br" 
                    className="text-primary hover:underline transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    VX GO - VX Motors
                  </a>
                  , concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se você não concordar com algum desses termos, está proibido de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-10 mb-6">
                  2. Uso de Licença
                </h2>
                <p className="leading-relaxed mb-4">
                  É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site VX GO - VX Motors, apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob esta licença, você não pode:
                </p>
                <ol className="list-decimal pl-6 space-y-3 mb-6">
                  <li>modificar ou copiar os materiais;</li>
                  <li>usar os materiais para qualquer finalidade comercial ou para exibição pública (comercial ou não comercial);</li>
                  <li>tentar descompilar ou fazer engenharia reversa de qualquer software contido no site VX GO - VX Motors;</li>
                  <li>remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou</li>
                  <li>transferir os materiais para outra pessoa ou 'espelhe' os materiais em qualquer outro servidor.</li>
                </ol>
                <p className="leading-relaxed mb-8">
                  Esta licença será automaticamente rescindida se você violar alguma dessas restrições e poderá ser rescindida por VX GO - VX Motors a qualquer momento. Ao encerrar a visualização desses materiais ou após o término desta licença, você deve apagar todos os materiais baixados em sua posse, seja em formato eletrónico ou impresso.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-10 mb-6">
                  3. Isenção de responsabilidade
                </h2>
                <ol className="list-decimal pl-6 space-y-4 mb-8">
                  <li>
                    Os materiais no site da VX GO - VX Motors são fornecidos 'como estão'. VX GO - VX Motors não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.
                  </li>
                  <li>
                    Além disso, o VX GO - VX Motors não garante ou faz qualquer representação relativa à precisão, aos resultados prováveis ou à confiabilidade do uso dos materiais em seu site ou de outra forma relacionado a esses materiais ou em sites vinculados a este site.
                  </li>
                </ol>

                <h2 className="text-2xl font-bold text-foreground mt-10 mb-6">
                  4. Limitações
                </h2>
                <p className="leading-relaxed mb-8">
                  Em nenhum caso o VX GO - VX Motors ou seus fornecedores serão responsáveis por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em VX GO - VX Motors, mesmo que VX GO - VX Motors ou um representante autorizado da VX GO - VX Motors tenha sido notificado oralmente ou por escrito da possibilidade de tais danos. Como algumas jurisdições não permitem limitações em garantias implícitas, ou limitações de responsabilidade por danos consequentes ou incidentais, essas limitações podem não se aplicar a você.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-10 mb-6">
                  5. Precisão dos materiais
                </h2>
                <p className="leading-relaxed mb-8">
                  Os materiais exibidos no site da VX GO - VX Motors podem incluir erros técnicos, tipográficos ou fotográficos. VX GO - VX Motors não garante que qualquer material em seu site seja preciso, completo ou atual. VX GO - VX Motors pode fazer alterações nos materiais contidos em seu site a qualquer momento, sem aviso prévio. No entanto, VX GO - VX Motors não se compromete a atualizar os materiais.
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-10 mb-6">
                  6. Links
                </h2>
                <p className="leading-relaxed mb-8">
                  O VX GO - VX Motors não analisou todos os sites vinculados ao seu site e não é responsável pelo conteúdo de nenhum site vinculado. A inclusão de qualquer link não implica endosso por VX GO - VX Motors do site. O uso de qualquer site vinculado é por conta e risco do usuário.
                </p>

                <h3 className="text-xl font-bold text-foreground mt-10 mb-4">
                  Modificações
                </h3>
                <p className="leading-relaxed mb-8">
                  O VX GO - VX Motors pode revisar estes termos de serviço do site a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.
                </p>

                <h3 className="text-xl font-bold text-foreground mt-10 mb-4">
                  Lei aplicável
                </h3>
                <p className="leading-relaxed">
                  Estes termos e condições são regidos e interpretados de acordo com as leis do VX GO - VX Motors e você se submete irrevogavelmente à jurisdição exclusiva dos tribunais naquele estado ou localidade.
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

export default TermosCondicoes;
