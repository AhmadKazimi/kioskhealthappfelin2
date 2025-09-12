"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Physician } from "./physicians-grid";

interface PhysicianDialogProps {
    open: boolean;
    getSelectedPhysician : () => Partial<Physician> | null;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: {
        UserName: string;
        Name: string;
        Surname: string;
        EmailAddress: string;
        Password: string;
    }) => Promise<string>;
}

export default function PhysicianDialog({
    open,
    getSelectedPhysician,
    onOpenChange,
    onSubmit,
}: PhysicianDialogProps) {
    const [formData, setFormData] = useState({
        UserName: "",
        Name: "",
        Surname: "",
        EmailAddress: "",
        Password: "",
    });

    const [errors, setErrors] = useState({
        UserName: "",
        Name: "",
        Password: "",
        EmailAddress: "",
    });

    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [currentPhysician, setCurrentPhysician] = useState<Partial<Physician> | null>(null);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setCurrentPhysician(getSelectedPhysician())

            if(currentPhysician){
                setFormData({
                    UserName: currentPhysician.UserName ?? "",
                    Name: currentPhysician.Name ?? "",
                    Surname: currentPhysician.Surname ?? "",
                    EmailAddress: currentPhysician.EmailAddress ?? "",
                    Password: currentPhysician.Password ?? "",
                });
            }
            else{
                setFormData({
                    UserName: "",
                    Name: "",
                    Surname: "",
                    EmailAddress: "",
                    Password: "",
                });
            }
            
            setErrors({
                UserName: "",
                Name: "",
                Password: "",
                EmailAddress: "",
            });
            setSubmitError("");
        }
    }, [open]);

    const validate = (physicianData: typeof formData) => {
        const newErrors = {
            UserName: physicianData.UserName ? "" : "Required",
            Name: physicianData.Name ? "" : "Required",
            Password: physicianData.Password ? "" : "Required",
            EmailAddress: physicianData.EmailAddress == "" ? "Required" : /^\S+@\S+$/.test(physicianData.EmailAddress) ? "" : "Invalid email",
        };

        setErrors(newErrors);
        return !Object.values(newErrors).some(Boolean);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

        if (!validate(formData)) {
            return;
        }

        setIsSubmitting(true);
        try {
            const errorMessage = await onSubmit(formData);
            if(errorMessage){
                setSubmitError(errorMessage);
            }
            else{
                onOpenChange(false);
            } 
        } catch (error) {
            setSubmitError( error instanceof Error ? error.message : "Failed to save physician");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] background-white">
                <DialogHeader>
                    <DialogTitle>Add New Physician</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Username Field */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="username" className="text-right mt-2">
                                Username
                            </Label>
                            <div className="col-span-3 space-y-1">
                                <Input
                                     id="physician-username"  
                                    name="physician-username"  
                                    autoComplete="new-username" 
                                    value={formData.UserName}
                                    onChange={(e) =>{
                                        setFormData({ ...formData, UserName: e.target.value });
                                        setErrors({ ...errors, UserName: e.target.value ? "" : "Required" }); 
                                    }}
                                    className={errors.UserName ? "border-red-500" : ""} 
                                />
                                {errors.UserName && (
                                    <p className="text-sm text-red-500">{errors.UserName}</p>
                                )}
                            </div>
                        </div>

                        {/* Name Field */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="name" className="text-right mt-2">
                                Name
                            </Label>
                            <div className="col-span-3 space-y-1">
                                <Input
                                    id="name"
                                    value={formData.Name}
                                    onChange={(e) =>{
                                        setFormData({ ...formData, Name: e.target.value });
                                        setErrors({ ...errors, Name: e.target.value ? "" : "Required" }); 
                                    }}
                                    className={errors.Name ? "border-red-500" : ""}
                                />
                                {errors.Name && (
                                    <p className="text-sm text-red-500">{errors.Name}</p>
                                )}
                            </div>
                        </div>

                        {/* Surname Field */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="surname" className="text-right mt-2">
                                Surname
                            </Label>
                            <div className="col-span-3 space-y-1">
                                <Input
                                    id="surname"
                                    value={formData.Surname}
                                    onChange={(e) =>{
                                        setFormData({ ...formData, Surname: e.target.value }); 
                                    }}
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="email" className="text-right mt-2">
                                Email
                            </Label>
                            <div className="col-span-3 space-y-1">
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.EmailAddress}
                                    onChange={(e) =>{
                                        setFormData({ ...formData, EmailAddress: e.target.value });
                                        setErrors({ ...errors, EmailAddress: e.target.value == "" ? "Required" : /^\S+@\S+$/.test(e.target.value) ? "" : "Invalid email" }); 
                                    }}
                                    className={errors.EmailAddress ? "border-red-500" : ""}
                                />
                                {errors.EmailAddress && (
                                    <p className="text-sm text-red-500">{errors.EmailAddress}</p>
                                )}
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="password" className="text-right mt-2"> Password </Label>

                            <div className="relative col-span-3 space-y-1"> 
                                <Input
                                   id="physician-password"  
                                    name="physician-password"  
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    value={formData.Password}
                                    onChange={(e) =>{
                                        setFormData({ ...formData, Password: e.target.value });
                                        setErrors({ ...errors, Password: e.target.value ? "" : "Required" }); 
                                    }}
                                    className={errors.Password ? "border-red-500 pr-10" : "pr-10"}
                                />
                                {errors.Password && (
                                    <p className="text-sm text-red-500">{errors.Password}</p>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="sr-only">
                                        {showPassword ? "Hide password" : "Show password"}
                                    </span>
                                </Button>
                            </div>
                        </div>
                        {/* <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="password" className="text-right mt-2">
                Password
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="password"
                   type={showPassword ? "text" : "password"}
                  value={formData.Password}
                  onChange={(e) =>
                    setFormData({ ...formData, Password: e.target.value })
                  }
                  className={errors.Password ? "border-red-500" : ""}
                />

                
                {errors.Password && (
                  <p className="text-sm text-red-500">{errors.Password}</p>
                )}
              </div>
            </div> */}
                    </div>

                    <DialogFooter className="flex flex-col gap-2">
                        {submitError && (
                            <p className="text-sm text-red-500 w-full text-center">
                                {submitError}
                            </p>
                        )}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            {isSubmitting ? "Saving..." : "Save Physician"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}