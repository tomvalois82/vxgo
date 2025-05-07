
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';

interface InstanceInfoCardProps {
  profileName: string | null;
  owner: string | null;
  profilePictureUrl: string | null;
}

export function InstanceInfoCard({ 
  profileName, 
  owner, 
  profilePictureUrl 
}: InstanceInfoCardProps) {
  // Extract phone number from owner (format: 553198296801@s.whatsapp.net)
  const phoneNumber = owner ? owner.split('@')[0] : '';

  return (
    <Card className="bg-muted/30 border-none overflow-hidden mt-4">
      <CardContent className="p-4 flex flex-col items-center space-y-2">
        <Avatar className="h-20 w-20 bg-muted/50">
          {profilePictureUrl ? (
            <AvatarImage src={profilePictureUrl} alt={profileName || 'Perfil'} />
          ) : (
            <AvatarFallback className="bg-primary/10">
              <User className="h-10 w-10 text-muted-foreground" />
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="flex flex-col items-center">
          <h3 className="font-medium text-lg">
            {profileName || 'Sem nome'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {phoneNumber || 'Número desconhecido'}
          </p>
        </div>

        <Badge variant="secondary" className="bg-green-700 hover:bg-green-800 rounded-full px-3">
          Connected
        </Badge>
      </CardContent>
    </Card>
  );
}
