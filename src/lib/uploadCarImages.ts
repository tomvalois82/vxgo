
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "./imageCompression";

/**
 * Faz upload de múltiplas imagens para o bucket "car-fotos" do Supabase Storage.
 * Comprime as imagens antes do upload para otimizar o armazenamento.
 * Retorna um array com as URLs públicas completas dos arquivos salvos.
 * @param files Arquivos a serem enviados (FileList ou array de File)
 */
export async function uploadCarImages(files: FileList | File[]): Promise<string[]> {
  const uploadedUrls: string[] = [];
  const BUCKET_NAME = "car-fotos";

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // Comprimir imagem antes do upload
      const compressedFile = await compressImage(file);
      
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`; // Sanitize filename
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, compressedFile, { upsert: false });

      if (error) {
        console.error("Supabase upload error:", error);
        throw new Error(`Erro ao enviar imagem ${file.name}: ${error.message}`);
      }
      
      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
      if (!data.publicUrl) {
        console.error("Error getting public URL for:", fileName);
        throw new Error(`Erro ao obter URL pública para ${fileName}. O upload pode ter falhado silenciosamente ou o arquivo não está acessível.`);
      }
      uploadedUrls.push(data.publicUrl);
    } catch (compressionError) {
      console.error("Image compression error:", compressionError);
      throw new Error(`Erro ao processar imagem ${file.name}: ${compressionError instanceof Error ? compressionError.message : 'Erro desconhecido'}`);
    }
  }
  return uploadedUrls;
}
