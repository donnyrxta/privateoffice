"use client";
import * as React from "react";
import {Dialog as Primitive} from "radix-ui";
import {X} from "lucide-react";
import {cn} from "@/lib/utils";
export const Dialog=Primitive.Root; export const DialogTrigger=Primitive.Trigger; export const DialogClose=Primitive.Close;
export function DialogContent({className,children,...props}:React.ComponentProps<typeof Primitive.Content>){return <Primitive.Portal><Primitive.Overlay className="fixed inset-0 z-50 bg-black/55"/><Primitive.Content data-slot="dialog-content" className={cn("fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white border border-border p-6 shadow-xl",className)} {...props}>{children}<Primitive.Close aria-label="Close" className="absolute right-4 top-4"><X size={18}/></Primitive.Close></Primitive.Content></Primitive.Portal>;}
export function DialogTitle(props:React.ComponentProps<typeof Primitive.Title>){return <Primitive.Title data-slot="dialog-title" {...props}/>;}
export function DialogDescription(props:React.ComponentProps<typeof Primitive.Description>){return <Primitive.Description data-slot="dialog-description" {...props}/>;}
