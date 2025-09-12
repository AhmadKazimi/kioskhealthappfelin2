/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AgreementModal: React.FC<AgreementModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:shadow-none print:border-none bg-white">
        <DialogHeader className="mb-3">
          <h3 className="text-2xl font-bold uppercase text-center">
            {t('agreement.title')}
          </h3>
        </DialogHeader>

        <div className="space-y-6 text-gray-700 text-[16px]">
          <div>
            <strong>{t('agreement.sections.confidential.title')}</strong>
            <p className="mt-2">
              {t('agreement.sections.confidential.content')}
            </p>
          </div>

          <div>
            <strong>{t('agreement.sections.prohibitions.title')}</strong>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>{t('agreement.sections.prohibitions.items.0')}</li>
              <li>{t('agreement.sections.prohibitions.items.1')}</li>
              <li>{t('agreement.sections.prohibitions.items.2')}</li>
            </ul>
          </div>

          <div>
            <strong>{t('agreement.sections.derivativeUse.title')}</strong>
            <p className="mt-2">
              {t('agreement.sections.derivativeUse.content')}
            </p>
          </div>

          <div>
            <strong>{t('agreement.sections.reverseEngineering.title')}</strong>
            <p className="mt-2">
              {t('agreement.sections.reverseEngineering.content')}
            </p>
          </div>

          <div>
            <strong>{t('agreement.sections.nonDisclosure.title')}</strong> 
            <p className="mt-2">
              {t('agreement.sections.nonDisclosure.content')}
            </p>
          </div>

          <div>
            <strong>{t('agreement.sections.legalEnforcement.title')}</strong>
            <p className="mt-2">
              {t('agreement.sections.legalEnforcement.content')}
            </p>
          </div>

          <div className="text-center text-sm text-black mt-8">
            {t('agreement.footer')}
          </div>
        </div>
        <DialogFooter className="mt-6"></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgreementModal;
