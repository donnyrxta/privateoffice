"use client";
import * as React from "react";
import {AlertDialog as Primitive} from "radix-ui";
import {cn} from "@/lib/utils";
export const AlertDialog=Primitive.Root; export const AlertDialogTrigger=Primitive.Trigger;
export function AlertDialogContent({className,...props}:React.ComponentProps<typeof Primitive.Content>){return <Primitive.Portal><Primitive.Overlay className="fixed inset-0 z-50 bg-black/55"/><Primitive.Content className={cn("fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white border border-border p-6 shadow-xl",className)} {...props}/></Primitive.Portal>;}
export function AlertDialogHeader(props:React.ComponentProps<"div">){return <div className="grid gap-2" {...props}/>;} export function AlertDialogFooter(props:React.ComponentProps<"div">){return <div className="actions section-gap" {...props}/>;}
export const AlertDialogTitle=Primitive.Title; export const AlertDialogDescription=Primitive.Description;
export function AlertDialogCancel({className,...props}:React.ComponentProps<typeof Primitive.Cancel>){return <Primitive.Cancel className={cn("button outline",className)} {...props}/>;}
export function AlertDialogAction({className,...props}:React.ComponentProps<typeof Primitive.Action>){return <Primitive.Action className={cn("button danger",className)} {...props}/>;}
