"use client";
import * as React from "react";
import {Checkbox as Primitive} from "radix-ui";
import {Check} from "lucide-react";
import {cn} from "@/lib/utils";
export function Checkbox({className,...props}:React.ComponentProps<typeof Primitive.Root>){return <Primitive.Root data-slot="checkbox" className={cn("inline-grid place-items-center border border-input bg-white rounded-sm",className)} {...props}><Primitive.Indicator><Check size={14}/></Primitive.Indicator></Primitive.Root>;}
