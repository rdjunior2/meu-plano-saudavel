import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { motion } from 'framer-motion';

interface AppTabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  items: {
    value: string;
    label: string;
    icon?: ReactNode;
    content: ReactNode;
    disabled?: boolean;
  }[];
  isAdmin?: boolean;
  className?: string;
  tabsListClassName?: string;
  fullWidth?: boolean;
  centered?: boolean;
  variant?: 'default' | 'pills' | 'underline' | 'minimal';
  animate?: boolean;
}

const AppTabs: React.FC<AppTabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  items,
  isAdmin = false,
  className,
  tabsListClassName,
  fullWidth = false,
  centered = false,
  variant = 'default',
  animate = true
}) => {
  // Determinar as classes de estilo com base na variante e no tipo (admin/user)
  const getTabsListStyle = () => {
    const baseClasses = [];
    
    switch (variant) {
      case 'pills':
        baseClasses.push(isAdmin 
          ? 'bg-white p-1 rounded-lg border border-secondary-100' 
          : 'bg-white p-1 rounded-lg border border-primary-100');
        break;
      case 'underline':
        baseClasses.push(isAdmin 
          ? 'border-b border-secondary-100' 
          : 'border-b border-primary-100');
        break;
      case 'minimal':
        baseClasses.push('gap-4');
        break;
      default:
        baseClasses.push(isAdmin 
          ? 'bg-secondary-50 p-1 rounded-lg' 
          : 'bg-primary-50 p-1 rounded-lg');
        break;
    }
    
    if (centered) baseClasses.push('mx-auto');
    
    return baseClasses.join(' ');
  };
  
  const getTabTriggerStyle = () => {
    const baseClasses = [];
    
    switch (variant) {
      case 'pills':
        baseClasses.push(isAdmin 
          ? 'rounded-md py-2 px-3 text-secondary-700 font-medium data-[state=active]:bg-secondary-50 data-[state=active]:text-secondary-900 data-[state=active]:shadow-sm' 
          : 'rounded-md py-2 px-3 text-primary-700 font-medium data-[state=active]:bg-primary-50 data-[state=active]:text-primary-900 data-[state=active]:shadow-sm');
        break;
      case 'underline':
        baseClasses.push(isAdmin 
          ? 'rounded-none px-4 py-2 text-secondary-600 font-medium data-[state=active]:text-secondary-900 data-[state=active]:border-b-2 data-[state=active]:border-secondary-500' 
          : 'rounded-none px-4 py-2 text-primary-600 font-medium data-[state=active]:text-primary-900 data-[state=active]:border-b-2 data-[state=active]:border-primary-500');
        break;
      case 'minimal':
        baseClasses.push(isAdmin 
          ? 'rounded-none py-1 px-0.5 text-secondary-600 font-medium data-[state=active]:text-secondary-900 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-secondary-500' 
          : 'rounded-none py-1 px-0.5 text-primary-600 font-medium data-[state=active]:text-primary-900 data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary-500');
        break;
      default:
        baseClasses.push(isAdmin 
          ? 'rounded-md py-1.5 px-3 text-sm font-medium text-secondary-700 data-[state=active]:bg-white data-[state=active]:shadow-sm' 
          : 'rounded-md py-1.5 px-3 text-sm font-medium text-primary-700 data-[state=active]:bg-white data-[state=active]:shadow-sm');
        break;
    }
    
    baseClasses.push('transition-all duration-200');
    baseClasses.push('flex items-center');
    
    return baseClasses.join(' ');
  };
  
  // Animações para os conteúdos das abas
  const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };
  
  // Wrapper do conteúdo com ou sem animação
  const ContentWrapper = ({ children, value }: { children: ReactNode, value: string }) => {
    if (animate) {
      return (
        <TabsContent key={value} value={value} className="mt-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={contentVariants}
          >
            {children}
          </motion.div>
        </TabsContent>
      );
    }
    
    return (
      <TabsContent key={value} value={value} className="mt-4">
        {children}
      </TabsContent>
    );
  };
  
  return (
    <Tabs 
      defaultValue={defaultValue} 
      value={value}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      <TabsList 
        className={cn(
          getTabsListStyle(),
          "grid",
          fullWidth && `grid-cols-${items.length}`,
          !fullWidth && items.length <= 5 && "sm:w-auto",
          tabsListClassName
        )}
      >
        {items.map((item) => (
          <TabsTrigger 
            key={item.value} 
            value={item.value} 
            disabled={item.disabled}
            className={getTabTriggerStyle()}
          >
            {item.icon && (
              <span className={cn("mr-2", item.disabled && "opacity-50")}>
                {item.icon}
              </span>
            )}
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {items.map((item) => (
        <ContentWrapper key={item.value} value={item.value}>
          {item.content}
        </ContentWrapper>
      ))}
    </Tabs>
  );
};

export default AppTabs; 