import { useEffect, useRef, useState } from 'react';
import { X, Plus, Trash2, AlertTriangle, ChevronDown, Layers } from 'lucide-react';
import { api } from '../services/api';
import './StacksModal.css';

interface Stack {
  id: string;
  name: string;
}

interface StacksModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Stacks já associadas ao perfil (passadas da página pai) */
  profileStacks: Stack[];
  /** Callback chamado após qualquer alteração, para o pai re-buscar o perfil */
  onStacksChanged: () => void;
}

export function StacksModal({ isOpen, onClose, profileStacks, onStacksChanged }: StacksModalProps) {
  const [allStacks, setAllStacks] = useState<Stack[]>([]);
  const [currentStacks, setCurrentStacks] = useState<Stack[]>(profileStacks);
  const [selectedStackId, setSelectedStackId] = useState('');
  const [loadingStacks, setLoadingStacks] = useState(false);
  const [addingStack, setAddingStack] = useState(false);
  const [removingStackId, setRemovingStackId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  /* Sincroniza currentStacks quando as props mudam (reabertura do modal) */
  useEffect(() => {
    setCurrentStacks(profileStacks);
  }, [profileStacks]);

  /* Busca todas as stacks disponíveis ao abrir */
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccessMsg(null);
    setConfirmDeleteId(null);
    setSelectedStackId('');

    async function fetchStacks() {
      setLoadingStacks(true);
      try {
        const stacks = await api.listStacks();
        setAllStacks(stacks);
      } catch {
        setError('Não foi possível carregar a lista de stacks.');
      } finally {
        setLoadingStacks(false);
      }
    }
    fetchStacks();
  }, [isOpen]);

  /* Fecha ao clicar no overlay */
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  /* Stacks disponíveis = todas menos as já adicionadas */
  const availableStacks = allStacks.filter(
    (s) => !currentStacks.find((cs) => cs.id === s.id)
  );

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handleAddStack() {
    if (!selectedStackId) return;
    setError(null);
    setAddingStack(true);
    try {
      await api.addProfileStack(selectedStackId);
      const added = allStacks.find((s) => s.id === selectedStackId)!;
      setCurrentStacks((prev) => [...prev, added]);
      setSelectedStackId('');
      onStacksChanged();
      showSuccess(`"${added.name}" adicionada ao perfil!`);
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar stack.');
    } finally {
      setAddingStack(false);
    }
  }

  async function handleConfirmRemove() {
    if (!confirmDeleteId) return;
    const target = currentStacks.find((s) => s.id === confirmDeleteId);
    setRemovingStackId(confirmDeleteId);
    setConfirmDeleteId(null);
    setError(null);
    try {
      await api.removeProfileStack(confirmDeleteId);
      setCurrentStacks((prev) => prev.filter((s) => s.id !== confirmDeleteId));
      onStacksChanged();
      showSuccess(`"${target?.name}" removida do perfil.`);
    } catch (err: any) {
      setError(err.message || 'Erro ao remover stack.');
    } finally {
      setRemovingStackId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="stacks-modal__overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Gerenciar stacks"
    >
      <div className="stacks-modal__panel">
        {/* ── Header ── */}
        <div className="stacks-modal__header">
          <div className="stacks-modal__header-left">
            <div className="stacks-modal__header-icon">
              <Layers size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="stacks-modal__title">Gerenciar Stacks</h2>
              <p className="stacks-modal__subtitle">Adicione ou remova tecnologias do seu perfil</p>
            </div>
          </div>
          <button className="stacks-modal__close" onClick={onClose} aria-label="Fechar modal">
            <X size={18} />
          </button>
        </div>

        {/* ── Feedback ── */}
        {error && (
          <div className="stacks-modal__feedback stacks-modal__feedback--error">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="stacks-modal__feedback stacks-modal__feedback--success">
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── Confirm Delete ── */}
        {confirmDeleteId && (
          <div className="stacks-modal__confirm">
            <AlertTriangle size={16} className="stacks-modal__confirm-icon" />
            <p className="stacks-modal__confirm-text">
              Remover <strong>{currentStacks.find((s) => s.id === confirmDeleteId)?.name}</strong>?
              <br />
              <span className="stacks-modal__confirm-sub">
                A média salarial desta stack será recalculada automaticamente.
              </span>
            </p>
            <div className="stacks-modal__confirm-actions">
              <button
                className="stacks-modal__btn stacks-modal__btn--ghost"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancelar
              </button>
              <button
                className="stacks-modal__btn stacks-modal__btn--danger"
                onClick={handleConfirmRemove}
              >
                Confirmar remoção
              </button>
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div className="stacks-modal__body">
          {/* Adicionar nova stack */}
          <section className="stacks-modal__section">
            <h3 className="stacks-modal__section-title">Adicionar tecnologia</h3>

            {loadingStacks ? (
              <div className="stacks-modal__select-skeleton" />
            ) : (
              <div className="stacks-modal__add-row">
                <div className="stacks-modal__select-wrapper">
                  <select
                    className="stacks-modal__select"
                    value={selectedStackId}
                    onChange={(e) => setSelectedStackId(e.target.value)}
                    disabled={availableStacks.length === 0}
                  >
                    <option value="">
                      {availableStacks.length === 0
                        ? 'Nenhuma stack disponível'
                        : 'Selecione uma tecnologia…'}
                    </option>
                    {availableStacks.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="stacks-modal__select-icon" />
                </div>

                <button
                  className="stacks-modal__btn stacks-modal__btn--primary"
                  onClick={handleAddStack}
                  disabled={!selectedStackId || addingStack}
                >
                  {addingStack ? (
                    <span className="stacks-modal__spinner" />
                  ) : (
                    <Plus size={16} />
                  )}
                  <span>Adicionar</span>
                </button>
              </div>
            )}
          </section>

          {/* Stacks no perfil */}
          <section className="stacks-modal__section">
            <h3 className="stacks-modal__section-title">
              Suas stacks
              <span className="stacks-modal__count">{currentStacks.length}</span>
            </h3>

            {currentStacks.length === 0 ? (
              <div className="stacks-modal__empty">
                <Layers size={28} strokeWidth={1.2} />
                <p>Nenhuma stack cadastrada ainda.</p>
              </div>
            ) : (
              <ul className="stacks-modal__list">
                {currentStacks.map((stack, i) => (
                  <li
                    key={stack.id}
                    className={`stacks-modal__item ${removingStackId === stack.id ? 'stacks-modal__item--removing' : ''}`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <span className="stacks-modal__item-dot" />
                    <span className="stacks-modal__item-name">{stack.name}</span>
                    <button
                      className="stacks-modal__remove-btn"
                      onClick={() => setConfirmDeleteId(stack.id)}
                      disabled={removingStackId === stack.id || !!confirmDeleteId}
                      aria-label={`Remover ${stack.name}`}
                    >
                      {removingStackId === stack.id ? (
                        <span className="stacks-modal__spinner stacks-modal__spinner--sm" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="stacks-modal__footer">
          <button className="stacks-modal__btn stacks-modal__btn--secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}