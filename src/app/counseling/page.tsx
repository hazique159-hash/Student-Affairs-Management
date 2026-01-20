import { HeartHandshake, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { counselingSessions } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { format } from "date-fns";

export default function CounselingPage() {
  
  const studentAvatars = {
    'CS-004': PlaceHolderImages.find(p => p.id === 'student-1'),
    'BCS223094': PlaceHolderImages.find(p => p.id === 'student-2'),
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Counseling Services" icon={HeartHandshake} description="Schedule and manage student counseling sessions.">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Session
        </Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>Here are the counseling sessions scheduled for the upcoming days.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {counselingSessions.map((session) => {
              const avatar = studentAvatars[session.studentId as keyof typeof studentAvatars];
              return (
                <li key={session.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    {avatar && (
                        <Avatar>
                          <AvatarImage src={avatar.imageUrl} alt={session.studentName} data-ai-hint={avatar.imageHint} />
                          <AvatarFallback>{session.studentName.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                    <div>
                      <p className="font-semibold">{session.studentName}</p>
                      <p className="text-sm text-muted-foreground">{session.studentId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground"/>
                      {format(session.date, "PPP")}
                    </p>
                    <p className="text-sm text-muted-foreground">{session.time}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
