
/**
 * Comprime uma imagem para no máximo 500KB mantendo boa qualidade visual
 */
export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular dimensões mantendo proporção (máximo 1920x1080)
      let { width, height } = calculateDimensions(img.width, img.height);
      
      canvas.width = width;
      canvas.height = height;
      
      if (!ctx) {
        reject(new Error('Erro ao criar contexto do canvas'));
        return;
      }
      
      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Comprimir com qualidade inicial de 0.8
      compressToTargetSize(canvas, file.name, 0.8, resolve, reject);
    };
    
    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
}

function calculateDimensions(originalWidth: number, originalHeight: number) {
  const MAX_WIDTH = 1920;
  const MAX_HEIGHT = 1080;
  
  let width = originalWidth;
  let height = originalHeight;
  
  // Redimensionar se exceder limites
  if (width > MAX_WIDTH) {
    height = (height * MAX_WIDTH) / width;
    width = MAX_WIDTH;
  }
  
  if (height > MAX_HEIGHT) {
    width = (width * MAX_HEIGHT) / height;
    height = MAX_HEIGHT;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

function compressToTargetSize(
  canvas: HTMLCanvasElement,
  fileName: string,
  quality: number,
  resolve: (file: File) => void,
  reject: (error: Error) => void
) {
  const MAX_SIZE = 500 * 1024; // 500KB
  
  canvas.toBlob((blob) => {
    if (!blob) {
      reject(new Error('Erro ao comprimir imagem'));
      return;
    }
    
    // Se já está no tamanho correto, usar essa qualidade
    if (blob.size <= MAX_SIZE) {
      const compressedFile = new File([blob], fileName, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      resolve(compressedFile);
      return;
    }
    
    // Se ainda está muito grande e qualidade > 0.1, tentar com menor qualidade
    if (quality > 0.1) {
      compressToTargetSize(canvas, fileName, quality - 0.1, resolve, reject);
      return;
    }
    
    // Se chegou ao limite mínimo de qualidade, usar o que temos
    const compressedFile = new File([blob], fileName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
    resolve(compressedFile);
  }, 'image/jpeg', quality);
}
