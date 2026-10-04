import {useLocation, useNavigate, useParams} from "react-router-dom";
import {useCreateRepairCompany, useGetRepairCompany, useUpdateRepairCompany} from "./utils/repair.queries.js";
import React, {useEffect} from "react";
import {useFormLogic} from "../../hooks/useEntityForm.js";
import {Alert, Box, CircularProgress, Paper, Stack, TextField, Typography} from "@mui/material";
import AppBreadcrumbs from "../../components/AppBreadcrumbs.jsx";
import {EMAIL_HINT} from "../../utils/email.js";
import FormActions from "../../components/ui/FormActions.jsx";

const emptyForm = {
    name: '',
    organization: '',
    address: '',
    phone: '',
    email: '',
}

export default function RepairCompanyFormPage() {
    const {id} = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()
    const location = useLocation()
    const backPath = location.state?.from || '/'

    const {data: repairCompany, isLoading: loadingCompany, error: loadError} = useGetRepairCompany(id)
    const createCompany = useCreateRepairCompany()
    const updateCompany = useUpdateRepairCompany()

    const saving = createCompany.isPending || updateCompany.isPending

    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            setPhoneError('')
            setEmailError('')
            return
        }

        if (repairCompany) {
            setForm({
                name: repairCompany.name ?? '',
                organization: repairCompany.organization ?? '',
                address: repairCompany.address ?? '',
                phone: repairCompany.phone ?? '',
                email: repairCompany.email ?? '',
            })
            setPhoneError('')
            setEmailError('')
        }
    }, [repairCompany, isEdit])

    useEffect(() => {
        if (loadError) {
            setError(loadError?.response?.data?.detail || 'Ошибка загрузки данных')
        }
    }, [loadError])

    const { form, setForm, error, setError, phoneError, setPhoneError, emailError, setEmailError, onChange, onSubmit } =
        useFormLogic({
            isEdit,
            id,
            emptyForm,
            updateMutation: updateCompany,
            createMutation: createCompany,
            redirectPath: '/repair/companies',
        })

    if (isEdit && loadingCompany) return <CircularProgress />

    return (
        <Box sx={{ p: 3, maxWidth: 700 }}>
            <AppBreadcrumbs dynamicLabels={{ id: repairCompany?.name }} />
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                    {isEdit ? `Редактировать ${form.organization || ''}` : 'Создать ремонтную компанию'}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <Box component="form" onSubmit={onSubmit}>
                    <Stack spacing={2}>
                        <TextField label="Наименование" value={form.name} onChange={onChange('name')} fullWidth />
                        <TextField
                            label="Наименование организации"
                            value={form.organization}
                            onChange={onChange('organization')}
                            fullWidth
                        />
                        <TextField label="Адрес" value={form.address} onChange={onChange('address')} fullWidth />
                        <TextField
                            label="Телефон"
                            value={form.phone}
                            onChange={onChange('phone')}
                            fullWidth
                            error={Boolean(phoneError)}
                            helperText={phoneError || 'Формат: +79991234567'}
                            placeholder="+79991234567"
                        />
                        <TextField
                            label="Эл. почта"
                            value={form.email}
                            onChange={onChange('email')}
                            error={Boolean(emailError)}
                            helperText={emailError || EMAIL_HINT}
                            placeholder="name@example.com"
                            fullWidth
                        />

                        <FormActions saving={saving} onCancel={() => navigate(backPath)} />
                    </Stack>
                </Box>
            </Paper>
        </Box>
    )
}