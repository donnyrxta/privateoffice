"use client";
import * as React from "react";
import {Select as Primitive} from "radix-ui";
import {Check,ChevronDown} from "lucide-react";
import {cn} from "@/lib/utils";
export const Select=Primitive.Root; export const SelectValue=Primitive.Value;
export function SelectTrigger({className,children,...props}:React.ComponentProps<typeof Primitive.Trigger>){return <Primitive.Trigger data-slot="select-trigger" className={cn("flex items-center justify-between border border-input bg-white px-3 py-2 rounded-sm",className)} {...props}>{children}<Primitive.Icon><ChevronDown size={16}/></Primitive.Icon></Primitive.Trigger>;}
export function SelectContent({className,children,...props}:React.ComponentProps<typeof Primitive.Content>){return <Primitive.Portal><Primitive.Content className={cn("z-50 min-w-[8rem] border border-border bg-white shadow-lg rounded-sm",className)} position="popper" {...props}><Primitive.Viewport className="p-1">{children}</Primitive.Viewport></Primitive.Content></Primitive.Portal>;}
export function SelectItem({className,children,...props}:React.ComponentProps<typeof Primitive.Item>){return <Primitive.Item className={cn("relative flex cursor-default items-center gap-2 px-3 py-2 text-sm outline-none data-[highlighted]:bg-muted",className)} {...props}><Primitive.ItemText>{children}</Primitive.ItemText><Primitive.ItemIndicator className="ml-auto"><Check size={14}/></Primitive.ItemIndicator></Primitive.Item>;}
