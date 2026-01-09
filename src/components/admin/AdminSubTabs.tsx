import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode } from "react";

interface SubTab {
  value: string;
  label: string;
  content: ReactNode;
}

interface AdminSubTabsProps {
  tabs: SubTab[];
  defaultValue?: string;
}

export const AdminSubTabs = ({ tabs, defaultValue }: AdminSubTabsProps) => {
  return (
    <Tabs defaultValue={defaultValue || tabs[0]?.value} className="space-y-4">
      <TabsList className="bg-muted/50">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};
