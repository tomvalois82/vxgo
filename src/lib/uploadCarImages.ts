
import { supabase } from "@/integrations/supabase/client";

/**
 * Faz upload de múltiplas imagens para o bucket "car-fotos" do Supabase Storage.
 * Retorna um array com os nomes dos arquivos salvos.
 * @param files Arquivos a serem enviados (FileList ou array de File)
 */
export async function uploadCarImages(files: FileList | File[]): Promise<string[]> {
  const uploadedNames: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("car-fotos")
      .upload(fileName, file, { upsert: false });
    if (error) {
      throw new Error(`Erro ao enviar imagem: ${error.message}`);
    }
    uploadedNames.push(fileName);
  }
  return uploadedNames;
}
