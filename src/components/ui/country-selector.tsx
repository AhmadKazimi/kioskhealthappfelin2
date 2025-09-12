/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import Select, { SingleValue } from "react-select";
import { Country } from "@/payload-types";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
    language: "en" | "ar";
    value?: string | number;  // Accept the ID value from parent
    onSelect: (id: string | number | null) => void; // Return just the ID
};

interface DropDownOption {
    value: string | number;
    label: string;
    data: Country;
}

const CountrySelector = ({ language, value, onSelect }: Props) => {
    const { t } = useTranslation();
    const [countries, setCountries] = useState<Country[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const isArabic = language === "ar";

    const options: DropDownOption[] = countries.map((country) => ({
        value: country.Id,
        label: isArabic ? country.ArabicName : country.EnglishName,
        data: country, 
    }));

    // Find the currently selected option based on the value prop
    const selectedOption = options.find(option => option.value === value);

    const customStyles = {
        control: (base: any, state: any) => ({
            ...base,
            direction: isArabic ? "rtl" : "ltr",
            minHeight: "32px",
            fontSize: "16px",
            padding: "2px 8px",
            border: state.isFocused ? "2px solid #407EFF" : "1px solid #6B7280",
            borderRadius: "12px",
            backgroundColor: state.isFocused ? "white" : "rgba(249, 250, 251, 0.5)",
            backdropFilter: "blur(4px)",
            transition: "all 300ms ease-out",
            boxShadow: state.isFocused ? "0 0 0 4px rgba(64, 126, 255, 0.1)" : "none",
            "&:hover": {
                border: "2px solid #D1D5DB",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
            },
        }),
        menu: (base: any) => ({
            ...base,
            direction: isArabic ? "rtl" : "ltr",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? "#407EFF" : state.isFocused ? "#F3F4F6" : "transparent",
            color: state.isSelected ? "white" : "#374151",
            "&:hover": {
                backgroundColor: state.isSelected ? "#407EFF" : "#F3F4F6",
            },
        }),
        placeholder: (base: any) => ({
            ...base,
            color: "#6B7280",
            fontWeight: "500",
        }),
        singleValue: (base: any) => ({
            ...base,
            color: "#374151",
        }),
    };

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${apiUrl}/Common/GetCountries`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                });

                const responseJson = await response.json();
                if (!responseJson.IsSuccess) throw new Error("Failed to fetch data");

                setCountries(responseJson.Result.filter((country: Country) => country.Id !== 0));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCountries();
    }, []);

    return (
        <div className="">
            <Select
                options={options}
                isRtl={isArabic}
                styles={customStyles}
                onChange={(option: SingleValue<DropDownOption>) => {
                    onSelect(option?.value ?? null); // Send just the ID back to parent
                }}
                value={selectedOption} // Controlled by the value prop
                placeholder={t('countrySelector.placeholder')}
                isSearchable
                isLoading={isLoading}
                formatOptionLabel={(option: DropDownOption) => (
                    <div className={`flex items-center gap-2 ${isArabic ? "flex-row-reverse" : ""}`}>
                        <i className={`${option.data.Flag} w-5 h-5`} />
                        <span>{option.label}</span>
                    </div>
                )}
            />
        </div>
    );
};

export default CountrySelector;