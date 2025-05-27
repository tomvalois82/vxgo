
import { supabase } from "@/integrations/supabase/client";

/**
 * Faz upload de múltiplas imagens para o bucket "car-fotos" do Supabase Storage.
 * Retorna um array com as URLs públicas completas dos arquivos salvos.
 * @param files Arquivos a serem enviados (FileList ou array de File)
 */
export async function uploadCarImages(files: FileList | File[]): Promise<string[]> {
  const uploadedUrls: string[] = [];
  const BUCKET_NAME = "car-fotos";

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`; // Sanitize filename
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, { upsert: false });

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
  }
  return uploadedUrls;
}
